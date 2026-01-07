# SyncApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiSyncPost**](#apisyncpost) | **POST** /api/Sync | |

# **apiSyncPost**
> FortedleServerModelsSyncResponse apiSyncPost()


### Example

```typescript
import {
    SyncApi,
    Configuration,
    FortedleServerModelsSyncRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new SyncApi(configuration);

let fortedleServerModelsSyncRequest: FortedleServerModelsSyncRequest; // (optional)

const { status, data } = await apiInstance.apiSyncPost(
    fortedleServerModelsSyncRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **fortedleServerModelsSyncRequest** | **FortedleServerModelsSyncRequest**|  | |


### Return type

**FortedleServerModelsSyncResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/*+json
 - **Accept**: text/plain, application/json, text/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

