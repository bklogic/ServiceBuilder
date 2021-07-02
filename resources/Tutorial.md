# Service Builder Tutorial

## Contents

- [How to connect Service Builder to your Backlogic workspace](#How-to-Connect-Service-Builder-to-Your-Workspace)
- [How to create application](#How-to-Create-Application)
- [How to create module](#How-to-Create-Module)
- [How to create query service](#How-to-Create-Query-Service)
- [How to create sql service](#how-to-create-sql-service)
- [How to create crud service](#how-to-create-crud-service)
- [How to generate simple crud services from database tables](#how-to-generate-simple-crud-services-from-database-tables)
- [How to deploy your service, module and application to DevTime](#how-to-deploy-your-service,-module-and-application-to-DevTime)

> The above also outlines the general steps of working with Service Builder, that is, connect to workspace, create application, module, and services, and deploy them to DevTime for DEV consumption.  
> The sample database used for this tutorial is the `classicmodels` database from `mysqltutorial.org`.  The ER diagram is available [here](https://www.mysqltutorial.org/mysql-sample-database.aspx).

## How to Connect Service Builder to Your Workspace

1. Get your workspace URL and access token from Service Console

2. Connect to your workspace
    - Move mouse over `Service Builder` in EXPLORER and click `Connect To BackLogic Workspace` ![Alt](./dark/plug.svg "New Application")
    - Paste your workspace URL in the input box open, and hit Enter
    - Paste you access code in the next input box open, and hit Enter

## How to Create Application

1. Generate Application
    - Move mouse over `Service Builder` and click `New Application` ![Alt](./dark/new-folder.svg "New Application")
    - Enter "myApp" as application name. Hit Enter.
    - Select "mysql" as database type.  Hit Entry.  

    Application is generated in seconds.

2. Configure Data Source
    - Move mouse over `myApp` and click `Config Data Source` ![Alt](./dark/database.svg "Config Data Source"), to open datasource.json
    - Edit url, username and password fields in `datasource.json` openned in editor
    - Click `Test Data Source Configuration` ![Alt](./dark/play.svg "Test Data Source Configuration") button to test database connection
    - Click `Save and Apply Data Source Configuration` ![Alt](./dark/save-all.svg "Save and Apply Data Source Configuration") button to save and apply data source configuration to workspce

## How to Create Module

1. Generate Module
    - Move mouse over `myApp` application and click `New Module` ![Alt](./dark/new-folder.svg "New Module")
    - Enter "myMod" as module name. Hit Enter.

    Module is generated in seconds for application `myApp`.

## How to Create Query Service

> Note: Here we are to create a query service to return a list of customers of complex structure by state.

1. Generate service
    - Move mouse over `myMod` module and click `New Query Service` ![Alt](./dark/window.svg "New Query Service")
    - Enter "getCustomersByState" as service name. Hit Enter.

    Service is generated in seconds.

2. Compose input
    - Copy and paste follwoing into the `input.json` file

    ```json
    {
        "state": "xyz"
    }
    ```

3. Compose output
    - Copy and paste following into the `output.json` file

    ```json
    [{
        "customernumber": 123,
        "customername": "abc",
        "phone": "abc",
        "address": {
            "address": "abc",
            "city": "abc",
            "state": "abc",
            "country": "abc"    
        },
        "salesRep": {
            "employeenumber": 123,
            "lastname": "abc",
            "firstname": "abc",
            "office": "abc"    
        },
        "orders": [{
            "ordernumber": 123,
            "orderdate": "2021-01-01T00:00:00.000Z",
            "status": "abc",
            "comments": "abc",
            "orderLines": [{
                "orderlinenumber": 123,       
                "productcode": "abc",
                "productname": "abc",
                "quantityordered": 123,
                "priceeach": 123
            }]
        }]
    }]
    ```

4. Compose query
    - Copy and paste follwoing into `query.sql` file

    ```sql
    select c.customerNumber, c.customerName, c.phone, 
           c.addressLine1 as address, c.city, c.state, c.country,
           e.employeeNumber, e.lastName, e.firstName, 
           concat(o.city, '-', o.country) as office,
           ord.orderNumber, ord.orderDate, ord.status, ord.comments,
           od.orderLineNumber, p.productCode, p.productName, 
           od.quantityOrdered, od.priceEach
    from classicmodels.customers c, 
        classicmodels.employees e, 
        classicmodels.offices o, 
        classicmodels.orders ord,
        classicmodels.orderdetails od, 
        classicmodels.products p
    where e.employeeNumber = c.salesRepEmployeeNumber
    and o.officeCode = e.officeCode
    and ord.customerNumber = c.customerNumber
    and od.orderNumber = ord.orderNumber
    and p.productCode = od.productCode
    and c.state = :state
    order by c.customerNumber, ord.orderNumber, od.orderLineNumber
    ```

5. Generate input and output Bindings
    - Move mouse over `getCustomersByState` service and click `Generate Input and Output Bindings` ![Alt](./dark/references.svg "Generate Input and Output Bindings")
    - Review and edit input and out bindings if necessary (no change here)

6. Test Service
    - Move mouse over `Tests` folder and click `Add Test` ![Alt](./dark/add.svg "Add Test"), to generate a test file
    - Review and edit input parameters in `test01.json` file. Make it looks like:

      ```json
        {
            "name": "get customer by state",
            "input": {
                "state": "CA"
            }
        }
      ```

    - click `Run Test` ![Alt](./dark/play.svg "Run Test") button to test the service

## How to Create SQL Service

> Note: here we are to creat a SQL command service to clone a product line and its products.

1. Generate service
    - Move mouse over `myMod` module and click `New SQL Service` ![Alt](./dark/server-process.svg "New SQL Service")
    - Enter "cloneProductLine" as service name. Hit Enter.

    Service is generated in seconds.

2. Compose input
    - Copy and paste follwoing into `input.json` file

    ```json
    {
        "scourceProductLine": "xyz",
        "newProductLine": "xyz"
    }
    ```

3. Compose output
    - Copy and paste follwoing into `output.json` file

    ```json
    {
        "productline": "abc",
        "description": "abc",
        "products": [{
            "productcode": "abc",
            "productname": "abc",
            "productvendor": "abc",
            "buyprice": 123,
            "msrp": 123    
        }]
    }
    ```

4. Compose SQLs
    - Copy and paste follwoing into `sqls.sql` file

    ```sql
    insert into classicmodels.productlines (
    productLine, textDescription, htmlDescription, image
    )
    select :newProductLine, textDescription, htmlDescription, image
    from classicmodels.productlines
    where productLine = :scourceProductLine
    ;

    insert into classicmodels.products (
    productCode, productName, productLine, productScale, productVendor, productDescription, buyPrice, MSRP
    )
    select concat('N_', productName) as productName, :newProductLine, productScale, productVendor, productDescription, buyPrice, MSRP
    from classicmodels.products
    where productLine = :scourceProductLine
    ;
    ```

5. Compose optional query
    - Copy and paste follwoing into `query.sql` file

    ```sql
    select pl.productLine, pl.textDescription as description,
        p.productCode, p.productName, productVendor,
        p.productDescription as description, buyPrice, MSRP
    from classicmodels.products p, classicmodels.productlines pl
    where p.productLine = pl.productLine
        and p.productLine = :newProductLine
    ```

6. Generate input and output Bindings
    - Move mouse over `cloneProductLine` service and click `Generate Input and Output Bindings` ![Alt](./dark/references.svg "Generate Input and Output Bindings")
    - Review and edit input and out bindings if necessary (skip)

7. Test Service
    - Move mouse over `Tests` folder and click `Add Test` ![Alt](./dark/add.svg "Add Test"), to generate a test file
    - Review and edit input parameters in `test01.json` file
    - click `Run Test` ![Alt](./dark/play.svg "Run Test") button to test the service

## How to Create CRUD Service

> Note: here we are to create a CRUD service for an aggregate root object Order. For CRUD service, read and write may be asymmetric. You will see in this example, the read operation reads from 4 tables but the write operations only write to 2 tables.

1. Generate service
    - Move mouse over `myMod` module and click New CRUD Service ![Alt](./dark/symbol-method.svg "New CRUD Service")
    - Enter "Order" as service name. Hit Enter.

    Service is generated in seconds.

2. Compose object
    - Copy and paste follwoing into `object.json` file

    ```json
    {
        "ordernumber": 123,
        "orderdate": "2021-01-01T00:00:00.000Z",
        "status": "abc",
        "comments": "abc",
        "customernumber": 123,
        "customername": "abc",
        "orderLines": [{
            "orderlinenumber": 123,
            "productcode": "abc",
            "productname": "abc",
            "quantityordered": 123,
            "priceeach": 123
        }]
    }
    ```

3. Compose READ query
    - Copy and paste follwoing into `query.sql` file

    ```sql
    select ord.orderNumber, ord.orderDate, ord.status, ord.comments,
        r_c.customerNumber, r_c.customerName,
        od.orderLineNumber, r_p.productCode, r_p.productName, 
        od.quantityOrdered, od.priceEach
    from classicmodels.orders ord
    join classicmodels.customers r_c on ord.customerNumber = r_c.customerNumber
    left join classicmodels.orderdetails od on od.orderNumber = ord.orderNumber
    left join classicmodels.products r_p on r_p.productCode = od.productCode
    where 1 = 1
      and ord.orderNumber = :orderNumber
      and ord.customerNumber = :customerNumber
      and ord.orderDate between :startDate and :endDate
      and status = :status
    order by ord.orderNumber, od.orderLineNumber
    ```

4. Generate input and output Bindings
    - Move mouse over `Order` service and click `Generate Input and Output Bindings` ![Alt](./dark/references.svg "Generate Input and Output Bindings")
    - Review and edit input and out bindings if necessary (skip)

5. Generate table bindings
    - Move mouse over `Order` service and click `Generate Table Bindings` ![Alt](./dark/multiple-windows.svg "Generate Table Bindings")
    - Review and edit tables bindings if necessary (skip)

6. Test Service
    - Move mouse over `Tests` folder and click `Add Test` ![Alt](./dark/add.svg "Add Test"), to generate a test file
    - Review and edit input parameters in `test01.json` file. Make it like:

    ```json
    {
        "name": "read by order number",
        "input": {
            "ordernumber": 123
        },
        "operation": "read"
    }
    ```

    or

    ```json
    {
        "name": "read by order date and status",
        "input": {
            "startDate": "2003-01-06T00:00:00.000Z",
            "startEnd": "2003-01-10T00:00:00.000Z",
            "status": "Shipped",
        },
        "operation": "read"
    }
    ```

    - Move mouse over `Tests` folder and click `Add Test` ![Alt](./dark/add.svg "Add Test"), to generate another test file
    - Review and edit input parameters in `test02.json` file. Make it like:

    ```json
    {
        "name": "create order",
        "input": {
            "ordernumber": 123,
            "orderdate": "2021-01-01T00:00:00.000Z",
            "status": "In Process",
            "comments": "my comments",
            "customernumber": 103,
            "customername": "abc",
            "orderLines": [
                {
                    "orderlinenumber": 12301,
                    "productcode": "S12_1099",
                    "productname": "1968 Ford Mustang",
                    "quantityordered": 12,
                    "priceeach": 123456
                }
            ]
        },
        "operation": "create"
    }
    ```

    - click `Run Test` ![Alt](./dark/play.svg "Run Test") button to test the service

## How to Generate Simple CRUD Services from Database Tables

- Move mouse over `myMod` module, right-click and select `Generate CRUD from Table`
- Select table "classicmodel.productLine" and "classicmodel.office". Hit Enter.

Two simple CRUD services are generated in seconds.

## How to Deploy Your Service, Module and Application to DevTime

You may deploy a service, a module or a whole application to DevTime as you please. Once deployed, the services are accesible through the DevTime endpoint.

1. Deploy service to DevTime
    - Move mouse over `getCustomersByState` service and click `Deploy Service` ![Alt](./dark/sync.svg "Deploy Service"), to deploy service `getCustomersByState`.

2. Deploy module to DevTime
    - Move mouse over `myMod` module and click `Deploy Module` ![Alt](./dark/sync.svg "Deploy Module"), to deploy module `myMod`.

3. Deploy application to DevTime
    - Move mouse over `myApp` application and click `Deploy Application` ![Alt](./dark/sync.svg "Deploy Application"), to deploy application `myApp`.
