# SyncApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiSyncPost**](#apisyncpost) | **POST** /api/Sync | |

# **apiSyncPost**
> FortedleServerModelsDTOsSyncResponse apiSyncPost()


### Example

```typescript
import {
    SyncApi,
    Configuration,
    FortedleServerModelsDTOsSyncRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new SyncApi(configuration);

let fortedleServerModelsDTOsSyncRequest: FortedleServerModelsDTOsSyncRequest; // (optional)

const { status, data } = await apiInstance.apiSyncPost(
    fortedleServerModelsDTOsSyncRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **fortedleServerModelsDTOsSyncRequest** | **FortedleServerModelsDTOsSyncRequest**|  | |


### Return type

**FortedleServerModelsDTOsSyncResponse**

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/*+json
 - **Accept**: text/plain, application/json, text/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

