# LeaderboardApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiLeaderboardGet**](#apileaderboardget) | **GET** /api/Leaderboard | |
|[**apiLeaderboardSubmitScorePost**](#apileaderboardsubmitscorepost) | **POST** /api/Leaderboard/submit-score | |

# **apiLeaderboardGet**
> FortedleServerModelsDTOsLeaderboardDto apiLeaderboardGet()


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

**FortedleServerModelsDTOsLeaderboardDto**

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

# **apiLeaderboardSubmitScorePost**
> FortedleServerModelsDTOsSubmitScoreResponse apiLeaderboardSubmitScorePost()


### Example

```typescript
import {
    LeaderboardApi,
    Configuration,
    FortedleServerModelsDTOsSubmitScoreRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new LeaderboardApi(configuration);

let fortedleServerModelsDTOsSubmitScoreRequest: FortedleServerModelsDTOsSubmitScoreRequest; // (optional)

const { status, data } = await apiInstance.apiLeaderboardSubmitScorePost(
    fortedleServerModelsDTOsSubmitScoreRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **fortedleServerModelsDTOsSubmitScoreRequest** | **FortedleServerModelsDTOsSubmitScoreRequest**|  | |


### Return type

**FortedleServerModelsDTOsSubmitScoreResponse**

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

