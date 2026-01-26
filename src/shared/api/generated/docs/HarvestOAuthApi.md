# HarvestOAuthApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiHarvestOauthExchangePost**](#apiharvestoauthexchangepost) | **POST** /api/harvest-oauth/exchange | |
|[**apiHarvestOauthRevokeDelete**](#apiharvestoauthrevokedelete) | **DELETE** /api/harvest-oauth/revoke | |
|[**apiHarvestOauthStatusGet**](#apiharvestoauthstatusget) | **GET** /api/harvest-oauth/status | |
|[**apiHarvestOauthTimeEntriesGet**](#apiharvestoauthtimeentriesget) | **GET** /api/harvest-oauth/time-entries | |
|[**apiHarvestOauthUserGet**](#apiharvestoauthuserget) | **GET** /api/harvest-oauth/user | |

# **apiHarvestOauthExchangePost**
> FortedleServerModelsDTOsExchangeTokenResponse apiHarvestOauthExchangePost()


### Example

```typescript
import {
    HarvestOAuthApi,
    Configuration,
    FortedleServerModelsDTOsExchangeTokenRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new HarvestOAuthApi(configuration);

let fortedleServerModelsDTOsExchangeTokenRequest: FortedleServerModelsDTOsExchangeTokenRequest; // (optional)

const { status, data } = await apiInstance.apiHarvestOauthExchangePost(
    fortedleServerModelsDTOsExchangeTokenRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **fortedleServerModelsDTOsExchangeTokenRequest** | **FortedleServerModelsDTOsExchangeTokenRequest**|  | |


### Return type

**FortedleServerModelsDTOsExchangeTokenResponse**

### Authorization

[oauth2](../README.md#oauth2)

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/*+json
 - **Accept**: text/plain, application/json, text/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiHarvestOauthRevokeDelete**
> apiHarvestOauthRevokeDelete()


### Example

```typescript
import {
    HarvestOAuthApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new HarvestOAuthApi(configuration);

const { status, data } = await apiInstance.apiHarvestOauthRevokeDelete();
```

### Parameters
This endpoint does not have any parameters.


### Return type

void (empty response body)

### Authorization

[oauth2](../README.md#oauth2)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiHarvestOauthStatusGet**
> FortedleServerModelsDTOsHarvestTokenStatusResponse apiHarvestOauthStatusGet()


### Example

```typescript
import {
    HarvestOAuthApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new HarvestOAuthApi(configuration);

const { status, data } = await apiInstance.apiHarvestOauthStatusGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**FortedleServerModelsDTOsHarvestTokenStatusResponse**

### Authorization

[oauth2](../README.md#oauth2)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: text/plain, application/json, text/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiHarvestOauthTimeEntriesGet**
> FortedleServerModelsDTOsHarvestTimeEntriesResponse apiHarvestOauthTimeEntriesGet()


### Example

```typescript
import {
    HarvestOAuthApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new HarvestOAuthApi(configuration);

let from: string; // (optional) (default to undefined)
let to: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiHarvestOauthTimeEntriesGet(
    from,
    to
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **from** | [**string**] |  | (optional) defaults to undefined|
| **to** | [**string**] |  | (optional) defaults to undefined|


### Return type

**FortedleServerModelsDTOsHarvestTimeEntriesResponse**

### Authorization

[oauth2](../README.md#oauth2)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: text/plain, application/json, text/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiHarvestOauthUserGet**
> FortedleServerModelsDTOsHarvestUserResponse apiHarvestOauthUserGet()


### Example

```typescript
import {
    HarvestOAuthApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new HarvestOAuthApi(configuration);

const { status, data } = await apiInstance.apiHarvestOauthUserGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**FortedleServerModelsDTOsHarvestUserResponse**

### Authorization

[oauth2](../README.md#oauth2)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: text/plain, application/json, text/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

