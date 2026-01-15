# LotteryTicketsApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiLotteryTicketsGet**](#apilotteryticketsget) | **GET** /api/LotteryTickets | |
|[**apiLotteryTicketsSeedTestDataPost**](#apilotteryticketsseedtestdatapost) | **POST** /api/LotteryTickets/seed-test-data | |
|[**apiLotteryTicketsSyncPost**](#apilotteryticketssyncpost) | **POST** /api/LotteryTickets/sync | |
|[**apiLotteryTicketsWinnersGet**](#apilotteryticketswinnersget) | **GET** /api/LotteryTickets/winners | |

# **apiLotteryTicketsGet**
> Array<FortedleServerModelsLotteryTicketDto> apiLotteryTicketsGet()


### Example

```typescript
import {
    LotteryTicketsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new LotteryTicketsApi(configuration);

let userId: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiLotteryTicketsGet(
    userId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **userId** | [**string**] |  | (optional) defaults to undefined|


### Return type

**Array<FortedleServerModelsLotteryTicketDto>**

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

# **apiLotteryTicketsSeedTestDataPost**
> apiLotteryTicketsSeedTestDataPost()


### Example

```typescript
import {
    LotteryTicketsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new LotteryTicketsApi(configuration);

const { status, data } = await apiInstance.apiLotteryTicketsSeedTestDataPost();
```

### Parameters
This endpoint does not have any parameters.


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiLotteryTicketsSyncPost**
> FortedleServerModelsSyncLotteryTicketsResponse apiLotteryTicketsSyncPost()


### Example

```typescript
import {
    LotteryTicketsApi,
    Configuration,
    FortedleServerModelsSyncLotteryTicketsRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new LotteryTicketsApi(configuration);

let fortedleServerModelsSyncLotteryTicketsRequest: FortedleServerModelsSyncLotteryTicketsRequest; // (optional)

const { status, data } = await apiInstance.apiLotteryTicketsSyncPost(
    fortedleServerModelsSyncLotteryTicketsRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **fortedleServerModelsSyncLotteryTicketsRequest** | **FortedleServerModelsSyncLotteryTicketsRequest**|  | |


### Return type

**FortedleServerModelsSyncLotteryTicketsResponse**

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

# **apiLotteryTicketsWinnersGet**
> FortedleServerModelsAllWinnersResponse apiLotteryTicketsWinnersGet()


### Example

```typescript
import {
    LotteryTicketsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new LotteryTicketsApi(configuration);

const { status, data } = await apiInstance.apiLotteryTicketsWinnersGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**FortedleServerModelsAllWinnersResponse**

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

