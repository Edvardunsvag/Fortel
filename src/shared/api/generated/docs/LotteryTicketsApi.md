# LotteryTicketsApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiLotteryTicketsConfigGet**](#apilotteryticketsconfigget) | **GET** /api/LotteryTickets/config | |
|[**apiLotteryTicketsConsumeWinnerMonthPositionPost**](#apilotteryticketsconsumewinnermonthpositionpost) | **POST** /api/LotteryTickets/consume-winner/{month}/{position} | |
|[**apiLotteryTicketsGet**](#apilotteryticketsget) | **GET** /api/LotteryTickets | |
|[**apiLotteryTicketsMonthlyDrawPost**](#apilotteryticketsmonthlydrawpost) | **POST** /api/LotteryTickets/monthly-draw | |
|[**apiLotteryTicketsMonthlyWinnersGet**](#apilotteryticketsmonthlywinnersget) | **GET** /api/LotteryTickets/monthly-winners | |
|[**apiLotteryTicketsMonthlyWinnersLatestGet**](#apilotteryticketsmonthlywinnerslatestget) | **GET** /api/LotteryTickets/monthly-winners/latest | |
|[**apiLotteryTicketsResetMonthPost**](#apilotteryticketsresetmonthpost) | **POST** /api/LotteryTickets/reset-month | |
|[**apiLotteryTicketsSeedTestDataPost**](#apilotteryticketsseedtestdatapost) | **POST** /api/LotteryTickets/seed-test-data | |
|[**apiLotteryTicketsStatisticsGet**](#apilotteryticketsstatisticsget) | **GET** /api/LotteryTickets/statistics | |
|[**apiLotteryTicketsSyncPost**](#apilotteryticketssyncpost) | **POST** /api/LotteryTickets/sync | |
|[**apiLotteryTicketsWheelGet**](#apilotteryticketswheelget) | **GET** /api/LotteryTickets/wheel | |
|[**apiLotteryTicketsWinnersGet**](#apilotteryticketswinnersget) | **GET** /api/LotteryTickets/winners | |

# **apiLotteryTicketsConfigGet**
> FortedleServerModelsDTOsLotteryConfigDto apiLotteryTicketsConfigGet()


### Example

```typescript
import {
    LotteryTicketsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new LotteryTicketsApi(configuration);

const { status, data } = await apiInstance.apiLotteryTicketsConfigGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**FortedleServerModelsDTOsLotteryConfigDto**

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

# **apiLotteryTicketsConsumeWinnerMonthPositionPost**
> apiLotteryTicketsConsumeWinnerMonthPositionPost()


### Example

```typescript
import {
    LotteryTicketsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new LotteryTicketsApi(configuration);

let month: string; // (default to undefined)
let position: number; // (default to undefined)

const { status, data } = await apiInstance.apiLotteryTicketsConsumeWinnerMonthPositionPost(
    month,
    position
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **month** | [**string**] |  | defaults to undefined|
| **position** | [**number**] |  | defaults to undefined|


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

# **apiLotteryTicketsGet**
> Array<FortedleServerModelsDTOsLotteryTicketDto> apiLotteryTicketsGet()


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

**Array<FortedleServerModelsDTOsLotteryTicketDto>**

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

# **apiLotteryTicketsMonthlyDrawPost**
> apiLotteryTicketsMonthlyDrawPost()


### Example

```typescript
import {
    LotteryTicketsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new LotteryTicketsApi(configuration);

const { status, data } = await apiInstance.apiLotteryTicketsMonthlyDrawPost();
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

# **apiLotteryTicketsMonthlyWinnersGet**
> FortedleServerModelsDTOsMonthlyWinnersResponse apiLotteryTicketsMonthlyWinnersGet()


### Example

```typescript
import {
    LotteryTicketsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new LotteryTicketsApi(configuration);

let month: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiLotteryTicketsMonthlyWinnersGet(
    month
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **month** | [**string**] |  | (optional) defaults to undefined|


### Return type

**FortedleServerModelsDTOsMonthlyWinnersResponse**

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

# **apiLotteryTicketsMonthlyWinnersLatestGet**
> FortedleServerModelsDTOsMonthlyWinnersResponse apiLotteryTicketsMonthlyWinnersLatestGet()


### Example

```typescript
import {
    LotteryTicketsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new LotteryTicketsApi(configuration);

const { status, data } = await apiInstance.apiLotteryTicketsMonthlyWinnersLatestGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**FortedleServerModelsDTOsMonthlyWinnersResponse**

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

# **apiLotteryTicketsResetMonthPost**
> apiLotteryTicketsResetMonthPost()


### Example

```typescript
import {
    LotteryTicketsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new LotteryTicketsApi(configuration);

let month: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiLotteryTicketsResetMonthPost(
    month
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **month** | [**string**] |  | (optional) defaults to undefined|


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

# **apiLotteryTicketsStatisticsGet**
> FortedleServerModelsDTOsEmployeeStatisticsResponse apiLotteryTicketsStatisticsGet()


### Example

```typescript
import {
    LotteryTicketsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new LotteryTicketsApi(configuration);

const { status, data } = await apiInstance.apiLotteryTicketsStatisticsGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**FortedleServerModelsDTOsEmployeeStatisticsResponse**

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

# **apiLotteryTicketsSyncPost**
> FortedleServerModelsDTOsSyncLotteryTicketsResponse apiLotteryTicketsSyncPost()


### Example

```typescript
import {
    LotteryTicketsApi,
    Configuration,
    FortedleServerModelsDTOsSyncLotteryTicketsRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new LotteryTicketsApi(configuration);

let fortedleServerModelsDTOsSyncLotteryTicketsRequest: FortedleServerModelsDTOsSyncLotteryTicketsRequest; // (optional)

const { status, data } = await apiInstance.apiLotteryTicketsSyncPost(
    fortedleServerModelsDTOsSyncLotteryTicketsRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **fortedleServerModelsDTOsSyncLotteryTicketsRequest** | **FortedleServerModelsDTOsSyncLotteryTicketsRequest**|  | |


### Return type

**FortedleServerModelsDTOsSyncLotteryTicketsResponse**

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

# **apiLotteryTicketsWheelGet**
> FortedleServerModelsDTOsWheelDataResponse apiLotteryTicketsWheelGet()


### Example

```typescript
import {
    LotteryTicketsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new LotteryTicketsApi(configuration);

const { status, data } = await apiInstance.apiLotteryTicketsWheelGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**FortedleServerModelsDTOsWheelDataResponse**

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

# **apiLotteryTicketsWinnersGet**
> FortedleServerModelsDTOsAllWinnersResponse apiLotteryTicketsWinnersGet()


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

**FortedleServerModelsDTOsAllWinnersResponse**

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

