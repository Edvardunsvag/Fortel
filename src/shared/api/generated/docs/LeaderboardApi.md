# LeaderboardApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiLeaderboardGet**](#apileaderboardget) | **GET** /api/Leaderboard | |
|[**apiLeaderboardSubmitScorePost**](#apileaderboardsubmitscorepost) | **POST** /api/Leaderboard/submit-score | |

# **apiLeaderboardGet**
> FortedleServerModelsLeaderboardDto apiLeaderboardGet()


### Example

```typescript
import {
    LeaderboardApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new LeaderboardApi(configuration);

let date: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiLeaderboardGet(
    date
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **date** | [**string**] |  | (optional) defaults to undefined|


### Return type

**FortedleServerModelsLeaderboardDto**

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

# **apiLeaderboardSubmitScorePost**
> FortedleServerModelsSubmitScoreResponse apiLeaderboardSubmitScorePost()


### Example

```typescript
import {
    LeaderboardApi,
    Configuration,
    FortedleServerModelsSubmitScoreRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new LeaderboardApi(configuration);

let fortedleServerModelsSubmitScoreRequest: FortedleServerModelsSubmitScoreRequest; // (optional)

const { status, data } = await apiInstance.apiLeaderboardSubmitScorePost(
    fortedleServerModelsSubmitScoreRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **fortedleServerModelsSubmitScoreRequest** | **FortedleServerModelsSubmitScoreRequest**|  | |


### Return type

**FortedleServerModelsSubmitScoreResponse**

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

