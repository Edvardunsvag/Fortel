# LotteryTicketsApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiLotteryTicketsSyncPost**](#apilotteryticketssyncpost) | **POST** /api/LotteryTickets/sync | |

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

