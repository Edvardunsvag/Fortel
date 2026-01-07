# RoundsApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiRoundsCurrentGet**](#apiroundscurrentget) | **GET** /api/Rounds/current | |
|[**apiRoundsFinishPost**](#apiroundsfinishpost) | **POST** /api/Rounds/finish | |
|[**apiRoundsGuessPost**](#apiroundsguesspost) | **POST** /api/Rounds/guess | |
|[**apiRoundsStartPost**](#apiroundsstartpost) | **POST** /api/Rounds/start | |

# **apiRoundsCurrentGet**
> FortedleServerModelsRoundDto apiRoundsCurrentGet()


### Example

```typescript
import {
    RoundsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RoundsApi(configuration);

let userId: string; // (optional) (default to undefined)
let date: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiRoundsCurrentGet(
    userId,
    date
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **userId** | [**string**] |  | (optional) defaults to undefined|
| **date** | [**string**] |  | (optional) defaults to undefined|


### Return type

**FortedleServerModelsRoundDto**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: text/plain, application/json, text/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiRoundsFinishPost**
> FortedleServerModelsRoundDto apiRoundsFinishPost()


### Example

```typescript
import {
    RoundsApi,
    Configuration,
    FortedleServerModelsFinishRoundRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new RoundsApi(configuration);

let fortedleServerModelsFinishRoundRequest: FortedleServerModelsFinishRoundRequest; // (optional)

const { status, data } = await apiInstance.apiRoundsFinishPost(
    fortedleServerModelsFinishRoundRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **fortedleServerModelsFinishRoundRequest** | **FortedleServerModelsFinishRoundRequest**|  | |


### Return type

**FortedleServerModelsRoundDto**

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

# **apiRoundsGuessPost**
> FortedleServerModelsRoundDto apiRoundsGuessPost()


### Example

```typescript
import {
    RoundsApi,
    Configuration,
    FortedleServerModelsSaveGuessRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new RoundsApi(configuration);

let fortedleServerModelsSaveGuessRequest: FortedleServerModelsSaveGuessRequest; // (optional)

const { status, data } = await apiInstance.apiRoundsGuessPost(
    fortedleServerModelsSaveGuessRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **fortedleServerModelsSaveGuessRequest** | **FortedleServerModelsSaveGuessRequest**|  | |


### Return type

**FortedleServerModelsRoundDto**

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

# **apiRoundsStartPost**
> FortedleServerModelsRoundDto apiRoundsStartPost()


### Example

```typescript
import {
    RoundsApi,
    Configuration,
    FortedleServerModelsStartRoundRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new RoundsApi(configuration);

let fortedleServerModelsStartRoundRequest: FortedleServerModelsStartRoundRequest; // (optional)

const { status, data } = await apiInstance.apiRoundsStartPost(
    fortedleServerModelsStartRoundRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **fortedleServerModelsStartRoundRequest** | **FortedleServerModelsStartRoundRequest**|  | |


### Return type

**FortedleServerModelsRoundDto**

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

