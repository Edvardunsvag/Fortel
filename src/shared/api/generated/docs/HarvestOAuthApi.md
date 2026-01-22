# HarvestOAuthApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiHarvestOauthExchangePost**](#apiharvestoauthexchangepost) | **POST** /api/harvest-oauth/exchange | |
|[**apiHarvestOauthRefreshPost**](#apiharvestoauthrefreshpost) | **POST** /api/harvest-oauth/refresh | |

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

No authorization required

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/*+json
 - **Accept**: text/plain, application/json, text/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiHarvestOauthRefreshPost**
> FortedleServerModelsDTOsRefreshTokenResponse apiHarvestOauthRefreshPost()


### Example

```typescript
import {
    HarvestOAuthApi,
    Configuration,
    FortedleServerModelsDTOsRefreshTokenRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new HarvestOAuthApi(configuration);

let fortedleServerModelsDTOsRefreshTokenRequest: FortedleServerModelsDTOsRefreshTokenRequest; // (optional)

const { status, data } = await apiInstance.apiHarvestOauthRefreshPost(
    fortedleServerModelsDTOsRefreshTokenRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **fortedleServerModelsDTOsRefreshTokenRequest** | **FortedleServerModelsDTOsRefreshTokenRequest**|  | |


### Return type

**FortedleServerModelsDTOsRefreshTokenResponse**

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

