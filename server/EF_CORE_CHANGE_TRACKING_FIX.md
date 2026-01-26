# EF Core Change Tracking Issue: Token Encryption Fix

## Executive Summary

When implementing encryption at rest for Harvest OAuth tokens, tokens were being saved as plaintext in the database despite encryption code being present. The root cause was **EF Core change tracking** - decrypted tokens were being tracked as modifications, which overrode the encrypted values during save operations.

## The Problem

### What We Expected
1. Token is retrieved from database (encrypted)
2. Token is decrypted for use in application
3. Token is encrypted before saving back to database
4. **Result**: Encrypted token in database ✅

### What Actually Happened
1. Token is retrieved from database (encrypted) → **EF Core tracks the entity**
2. Token is decrypted → **EF Core records this as a change**
3. Token is encrypted before saving → **EF Core still has decrypted values tracked**
4. **Result**: Plaintext token saved to database ❌

## Root Cause: EF Core Change Tracking

Entity Framework Core automatically tracks entities retrieved from the database. When you modify a tracked entity's properties, EF Core records those changes. When `SaveChangesAsync()` is called, EF Core saves all tracked changes, which can override values you set later.

### The Flow (Before Fix)

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Read Token                                          │
├─────────────────────────────────────────────────────────────┤
│ 1. GetByUserIdAsync() queries database                      │
│ 2. EF Core retrieves encrypted token entity                 │
│ 3. EF Core STARTS TRACKING the entity                       │
│ 4. Code decrypts token.AccessToken                          │
│ 5. EF Core DETECTS CHANGE: "AccessToken was modified!"      │
│ 6. Change Tracker records: AccessToken = decrypted_value    │
│ 7. Return decrypted token to application                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 2: Save Token                                          │
├─────────────────────────────────────────────────────────────┤
│ 1. UpsertAsync() encrypts the input token                   │
│ 2. Queries for existing token                               │
│ 3. EF Core returns TRACKED entity (with decrypted values)  │
│ 4. Code sets existing.AccessToken = encrypted_value          │
│ 5. SaveChangesAsync() is called                             │
│ 6. EF Core saves TRACKED changes (decrypted values) ❌      │
│ 7. Plaintext token saved to database                        │
└─────────────────────────────────────────────────────────────┘
```

## The Code (Before Fix)

### GetByUserIdAsync - Problematic Code
```csharp
public async Task<HarvestToken?> GetByUserIdAsync(string userId)
{
    // ❌ Entity is tracked by EF Core
    var token = await _context.HarvestTokens
        .FirstOrDefaultAsync(t => t.UserId == userId);

    if (token == null) return null;

    // Decrypt tokens - this modifies a TRACKED entity
    token.AccessToken = _encryptionService.TryDecrypt(token.AccessToken);
    token.RefreshToken = _encryptionService.TryDecrypt(token.RefreshToken);
    
    // ⚠️ EF Core has recorded these changes!
    return token;
}
```

### UpsertAsync - Problematic Code
```csharp
public async Task<HarvestToken> UpsertAsync(HarvestToken token)
{
    // Encrypt the input token
    var encryptedAccessToken = _encryptionService.Encrypt(token.AccessToken);
    var encryptedRefreshToken = _encryptionService.Encrypt(token.RefreshToken);

    // ❌ Returns TRACKED entity with decrypted values
    var existing = await _context.HarvestTokens
        .FirstOrDefaultAsync(t => t.UserId == token.UserId);

    if (existing != null)
    {
        // Set encrypted values
        existing.AccessToken = encryptedAccessToken;
        existing.RefreshToken = encryptedRefreshToken;
        
        // ⚠️ But EF Core change tracker still has decrypted values!
        _context.HarvestTokens.Update(existing);
        await _context.SaveChangesAsync();
        // ❌ Saves decrypted values instead of encrypted
    }
}
```

## The Solution

### Key Changes

1. **Use `AsNoTracking()` for read operations** - Prevents EF Core from tracking entities when we decrypt
2. **Detach tracked entities before updates** - Ensures we work with fresh data
3. **Query with `AsNoTracking()` in UpsertAsync** - Gets fresh entity from database
4. **Properly attach and update** - Correctly saves encrypted values

### The Flow (After Fix)

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Read Token                                          │
├─────────────────────────────────────────────────────────────┤
│ 1. GetByUserIdAsync() queries database                      │
│ 2. EF Core retrieves encrypted token entity                 │
│ 3. AsNoTracking() - Entity is NOT tracked ✅                 │
│ 4. Code decrypts token.AccessToken                          │
│ 5. No change tracking - no changes recorded ✅              │
│ 6. Return decrypted token to application                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 2: Save Token                                          │
├─────────────────────────────────────────────────────────────┤
│ 1. UpsertAsync() encrypts the input token                   │
│ 2. Detach any tracked entities (clean slate) ✅              │
│ 3. Query with AsNoTracking() - get fresh entity ✅          │
│ 4. Code sets existing.AccessToken = encrypted_value          │
│ 5. Attach entity and mark as Modified                       │
│ 6. SaveChangesAsync() is called                              │
│ 7. EF Core saves encrypted values ✅                        │
│ 8. Encrypted token saved to database ✅                     │
└─────────────────────────────────────────────────────────────┘
```

## The Fixed Code

### GetByUserIdAsync - Fixed Code
```csharp
public async Task<HarvestToken?> GetByUserIdAsync(string userId)
{
    // ✅ AsNoTracking() prevents EF Core from tracking the entity
    var token = await _context.HarvestTokens
        .AsNoTracking()
        .FirstOrDefaultAsync(t => t.UserId == userId);

    if (token == null) return null;

    // Decrypt tokens - entity is NOT tracked, so no changes recorded
    token.AccessToken = _encryptionService.TryDecrypt(token.AccessToken);
    token.RefreshToken = _encryptionService.TryDecrypt(token.RefreshToken);
    
    // ✅ EF Core doesn't track this entity - no changes recorded
    return token;
}
```

### UpsertAsync - Fixed Code
```csharp
public async Task<HarvestToken> UpsertAsync(HarvestToken token)
{
    // Encrypt the input token
    var encryptedAccessToken = _encryptionService.Encrypt(token.AccessToken);
    var encryptedRefreshToken = _encryptionService.Encrypt(token.RefreshToken);

    // ✅ Detach any tracked entities first
    var trackedEntity = _context.ChangeTracker.Entries<HarvestToken>()
        .FirstOrDefault(e => e.Entity.UserId == token.UserId);
    if (trackedEntity != null)
    {
        trackedEntity.State = EntityState.Detached;
    }

    // ✅ Query with AsNoTracking() to get fresh data
    var existing = await _context.HarvestTokens
        .AsNoTracking()
        .FirstOrDefaultAsync(t => t.UserId == token.UserId);

    if (existing != null)
    {
        // ✅ Attach fresh entity and set encrypted values
        _context.HarvestTokens.Attach(existing);
        existing.AccessToken = encryptedAccessToken;
        existing.RefreshToken = encryptedRefreshToken;
        existing.ExpiresAt = token.ExpiresAt;
        existing.AccountId = token.AccountId;
        existing.UpdatedAt = DateTime.UtcNow;
        
        // ✅ Mark as modified - EF Core will save encrypted values
        _context.Entry(existing).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        // ✅ Encrypted values saved correctly!
    }
}
```

## Key Concepts

### EF Core Change Tracking

**What is it?**
- EF Core automatically tracks entities retrieved from the database
- When you modify a tracked entity, EF Core records those changes
- On `SaveChangesAsync()`, EF Core saves all tracked changes

**Why is it useful?**
- Efficient updates (only changed properties are saved)
- Automatic change detection
- Optimistic concurrency support

**When does it cause problems?**
- When you modify entities for read-only purposes (like decryption)
- When you need to work with fresh data from the database
- When change tracking conflicts with your business logic

### AsNoTracking()

**What does it do?**
- Tells EF Core NOT to track the entity
- Entity is returned as a plain object
- Modifications to the entity are NOT recorded

**When to use it?**
- Read-only operations
- When you need to modify entities without tracking changes
- When you need fresh data from the database

**Performance benefit:**
- Slightly faster (no change tracking overhead)
- Lower memory usage (no tracking metadata)

## Visual Comparison

### Before Fix - Change Tracker State

```
Entity State After GetByUserIdAsync():
┌─────────────────────────────────────┐
│ HarvestToken (Tracked)              │
├─────────────────────────────────────┤
│ UserId: "user@example.com"          │
│ AccessToken: "decrypted_value" ⚠️   │
│ RefreshToken: "decrypted_value" ⚠️  │
│ State: Modified (tracked)           │
└─────────────────────────────────────┘

Entity State After UpsertAsync():
┌─────────────────────────────────────┐
│ HarvestToken (Tracked)              │
├─────────────────────────────────────┤
│ UserId: "user@example.com"          │
│ AccessToken: "encrypted_value"       │
│   BUT Change Tracker has:            │
│   "decrypted_value" ⚠️              │
│ State: Modified (conflicting)        │
└─────────────────────────────────────┘

Result: Decrypted value saved ❌
```

### After Fix - Change Tracker State

```
Entity State After GetByUserIdAsync():
┌─────────────────────────────────────┐
│ HarvestToken (Not Tracked)          │
├─────────────────────────────────────┤
│ UserId: "user@example.com"          │
│ AccessToken: "decrypted_value"       │
│ RefreshToken: "decrypted_value"      │
│ State: Detached ✅                   │
└─────────────────────────────────────┘

Entity State After UpsertAsync():
┌─────────────────────────────────────┐
│ HarvestToken (Fresh from DB)        │
├─────────────────────────────────────┤
│ UserId: "user@example.com"          │
│ AccessToken: "encrypted_value" ✅    │
│ RefreshToken: "encrypted_value" ✅   │
│ State: Modified (clean) ✅           │
└─────────────────────────────────────┘

Result: Encrypted value saved ✅
```

## Lessons Learned

### 1. Always Consider Change Tracking
When working with EF Core, always consider whether you want entities tracked or not. For read operations that modify entities (like decryption), use `AsNoTracking()`.

### 2. Pattern Consistency
Other repositories in the codebase already use `AsNoTracking()` for read operations. Following existing patterns would have prevented this issue.

### 3. Test Database State, Not Just Code
The code looked correct, but the database revealed the issue. Always verify that data is actually saved correctly, not just that the code compiles.

### 4. Logging Helps Debug
Adding debug logging (`LogDebug`) helped identify when encryption was being called and what values were being set.

## Prevention

### Code Review Checklist
- [ ] Are read operations using `AsNoTracking()` when entities are modified?
- [ ] Are update operations working with fresh entities from the database?
- [ ] Are tracked entities properly detached before updates?
- [ ] Does the code follow existing repository patterns?

### Testing Checklist
- [ ] Verify encrypted data is actually encrypted in the database
- [ ] Test entity updates with change tracking scenarios
- [ ] Test read-then-update flows
- [ ] Verify no plaintext sensitive data in database

## Summary

**Problem**: EF Core change tracking was saving decrypted token values instead of encrypted ones.

**Root Cause**: Entities were tracked when decrypted, and those tracked changes overrode encrypted values during save.

**Solution**: Use `AsNoTracking()` for read operations and properly manage entity state during updates.

**Result**: Tokens are now correctly encrypted at rest in the database. ✅

## Code Changes Summary

### Files Modified
- `server/Repositories/HarvestTokenRepository.cs`

### Changes Made
1. Added `AsNoTracking()` to `GetByUserIdAsync()` query
2. Added entity detachment logic in `UpsertAsync()`
3. Added `AsNoTracking()` to existing token query in `UpsertAsync()`
4. Changed from `Update()` to `Attach()` + `State = Modified` pattern
5. Added debug logging for encryption operations

### Impact
- ✅ Tokens are now encrypted at rest
- ✅ No breaking changes to API
- ✅ Follows existing repository patterns
- ✅ Minimal performance impact (AsNoTracking is actually faster)

