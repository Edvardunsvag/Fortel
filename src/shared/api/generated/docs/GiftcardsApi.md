# GiftcardsApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiGiftcardsGet**](#apigiftcardsget) | **GET** /api/Giftcards | |
|[**apiGiftcardsIdGet**](#apigiftcardsidget) | **GET** /api/Giftcards/{id} | |
|[**apiGiftcardsSendPost**](#apigiftcardssendpost) | **POST** /api/Giftcards/send | |
|[**apiGiftcardsUserUserIdGet**](#apigiftcardsuseruseridget) | **GET** /api/Giftcards/user/{userId} | |

# **apiGiftcardsGet**
> Array<FortedleServerModelsDTOsGiftcardTransactionDto> apiGiftcardsGet()


### Example

```typescript
import {
    GiftcardsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new GiftcardsApi(configuration);

const { status, data } = await apiInstance.apiGiftcardsGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<FortedleServerModelsDTOsGiftcardTransactionDto>**

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: text/plain, application/json, text/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiGiftcardsIdGet**
> FortedleServerModelsDTOsGiftcardTransactionDto apiGiftcardsIdGet()


### Example

```typescript
import {
    GiftcardsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new GiftcardsApi(configuration);

let id: number; // (default to undefined)

const { status, data } = await apiInstance.apiGiftcardsIdGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] |  | defaults to undefined|


### Return type

**FortedleServerModelsDTOsGiftcardTransactionDto**

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: text/plain, application/json, text/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiGiftcardsSendPost**
> FortedleServerModelsDTOsSendGiftcardResponse apiGiftcardsSendPost()


### Example

```typescript
import {
    GiftcardsApi,
    Configuration,
    FortedleServerModelsDTOsSendGiftcardRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new GiftcardsApi(configuration);

let fortedleServerModelsDTOsSendGiftcardRequest: FortedleServerModelsDTOsSendGiftcardRequest; // (optional)

const { status, data } = await apiInstance.apiGiftcardsSendPost(
    fortedleServerModelsDTOsSendGiftcardRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **fortedleServerModelsDTOsSendGiftcardRequest** | **FortedleServerModelsDTOsSendGiftcardRequest**|  | |


### Return type

**FortedleServerModelsDTOsSendGiftcardResponse**

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

# **apiGiftcardsUserUserIdGet**
> Array<FortedleServerModelsDTOsGiftcardTransactionDto> apiGiftcardsUserUserIdGet()


### Example

```typescript
import {
    GiftcardsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new GiftcardsApi(configuration);

let userId: string; // (default to undefined)

const { status, data } = await apiInstance.apiGiftcardsUserUserIdGet(
    userId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **userId** | [**string**] |  | defaults to undefined|


### Return type

**Array<FortedleServerModelsDTOsGiftcardTransactionDto>**

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: text/plain, application/json, text/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

