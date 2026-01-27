# EmployeesApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiEmployeesGet**](#apiemployeesget) | **GET** /api/Employees | |

# **apiEmployeesGet**
> Array<FortedleServerModelsDTOsEmployeeDto> apiEmployeesGet()


### Example

```typescript
import {
    EmployeesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new EmployeesApi(configuration);

const { status, data } = await apiInstance.apiEmployeesGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<FortedleServerModelsDTOsEmployeeDto>**

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

