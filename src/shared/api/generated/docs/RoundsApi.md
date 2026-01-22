# RoundsApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiRoundsCurrentGet**](#apiroundscurrentget) | **GET** /api/Rounds/current | |
|[**apiRoundsGuessPost**](#apiroundsguesspost) | **POST** /api/Rounds/guess | |
|[**apiRoundsRevealFunfactPost**](#apiroundsrevealfunfactpost) | **POST** /api/Rounds/reveal-funfact | |
|[**apiRoundsStartPost**](#apiroundsstartpost) | **POST** /api/Rounds/start | |

# **apiRoundsCurrentGet**
> FortedleServerModelsDTOsRoundDto apiRoundsCurrentGet()


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

**FortedleServerModelsDTOsRoundDto**

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

# **apiRoundsGuessPost**
> FortedleServerModelsDTOsRoundDto apiRoundsGuessPost()


### Example

```typescript
import {
    RoundsApi,
    Configuration,
    FortedleServerModelsDTOsSaveGuessRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new RoundsApi(configuration);

let fortedleServerModelsDTOsSaveGuessRequest: FortedleServerModelsDTOsSaveGuessRequest; // (optional)

const { status, data } = await apiInstance.apiRoundsGuessPost(
    fortedleServerModelsDTOsSaveGuessRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **fortedleServerModelsDTOsSaveGuessRequest** | **FortedleServerModelsDTOsSaveGuessRequest**|  | |


### Return type

**FortedleServerModelsDTOsRoundDto**

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

# **apiRoundsRevealFunfactPost**
> FortedleServerModelsDTOsRoundDto apiRoundsRevealFunfactPost()


### Example

```typescript
import {
    RoundsApi,
    Configuration,
    FortedleServerModelsDTOsRevealFunfactRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new RoundsApi(configuration);

let fortedleServerModelsDTOsRevealFunfactRequest: FortedleServerModelsDTOsRevealFunfactRequest; // (optional)

const { status, data } = await apiInstance.apiRoundsRevealFunfactPost(
    fortedleServerModelsDTOsRevealFunfactRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **fortedleServerModelsDTOsRevealFunfactRequest** | **FortedleServerModelsDTOsRevealFunfactRequest**|  | |


### Return type

**FortedleServerModelsDTOsRoundDto**

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

# **apiRoundsStartPost**
> FortedleServerModelsDTOsRoundDto apiRoundsStartPost()


### Example

```typescript
import {
    RoundsApi,
    Configuration,
    FortedleServerModelsDTOsStartRoundRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new RoundsApi(configuration);

let fortedleServerModelsDTOsStartRoundRequest: FortedleServerModelsDTOsStartRoundRequest; // (optional)

const { status, data } = await apiInstance.apiRoundsStartPost(
    fortedleServerModelsDTOsStartRoundRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **fortedleServerModelsDTOsStartRoundRequest** | **FortedleServerModelsDTOsStartRoundRequest**|  | |


### Return type

**FortedleServerModelsDTOsRoundDto**

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

