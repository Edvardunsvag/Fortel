# EmployeeWeeksApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiEmployeeWeeksGet**](#apiemployeeweeksget) | **GET** /api/EmployeeWeeks | |
|[**apiEmployeeWeeksSyncPost**](#apiemployeeweekssyncpost) | **POST** /api/EmployeeWeeks/sync | |

# **apiEmployeeWeeksGet**
> FortedleServerModelsDTOsEmployeeWeeksResponse apiEmployeeWeeksGet()


### Example

```typescript
import {
    EmployeeWeeksApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new EmployeeWeeksApi(configuration);

let userId: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiEmployeeWeeksGet(
    userId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **userId** | [**string**] |  | (optional) defaults to undefined|


### Return type

**FortedleServerModelsDTOsEmployeeWeeksResponse**

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

# **apiEmployeeWeeksSyncPost**
> FortedleServerModelsDTOsSyncHarvestResponse apiEmployeeWeeksSyncPost()


### Example

```typescript
import {
    EmployeeWeeksApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new EmployeeWeeksApi(configuration);

const { status, data } = await apiInstance.apiEmployeeWeeksSyncPost();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**FortedleServerModelsDTOsSyncHarvestResponse**

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

