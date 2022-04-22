# Getting Started with Service Builder

## Contents

- [Connect Service Builder to your Backlogic workspace](#connect-service-builder-to-your-workspace)
- [Create application](#create-application)
- [Create module](#create-module)
- [Create query service](#create-query-service)
- [Create SQL service](#create-sql-service)
- [Create CRUD service](#create-crud-service)
- [Generate simple CRUD services from database tables](#generate-simple-crud-services-from-database-tables)
- [Deploy service, module and application to DevTime](#deploy-service-module-and-application-to-devtime)
- [View and test services deployed on DevTime](#view-and-test-and-services-deployed-on-devtime)

This tutorial walks you throught the general steps of working with Service Builder. The sample database used for this tutorial is the `classicmodels` database from `mysqltutorial.org`. The ER diagram is available [here](https://www.mysqltutorial.org/mysql-sample-database.aspx).  

## Prerequite

- A BackLogic account, so that you can connect to a BackLogic workspace.
- A MySql database accesible from BackLogic workspace and pre-loaded with the `classicmodels` database.

However, if you are trying without signup, you will be assigned with a guest workspace and a guest database. After you start the try session, the application and module are automatically created for you. Please jump to the [create guery service](#create-query-service) section directly.

Otherwise, start from here.

## Connect Service Builder to Your Workspace

1. Get your workspace URL and access token from Service Console

2. Connect to your workspace
    - Move mouse over `WORKSPACE` explorer and click `Connection` ![Alt](./dark/plug.svg "Connection") and then click the `Connect` button on the information box.
    - Paste your workspace URL in the input box opened, and hit Enter
    - Paste you access code in the next input box opened, and hit Enter

   Service Builder is connected to your BackLogic workspace.

## Create Application

1. Generate Application
    - Move mouse over `APPLICATIONS` explorer and click `New Application` ![Alt](./dark/new-folder.svg "New Application")
    - Enter "myApp" as application name. Hit Enter.
    - Select "mysql" as database type.  Hit Entry.  

    Application is generated in seconds.

2. Configure Data Source
    - Open `datasource.json` file.
    - Edit the host, port, database, username and password fields.
    - Click `Test and Deploy Data Source Configuration` ![Alt](./dark/play.svg) to test database connection. If successful, the data source configuration will be automatically deployed to DevTime with the password encryped, and saved to your local file with the password masked.

## Create Module

1. Generate Module
    - Move mouse over `myApp` application and click `New Module` ![Alt](./dark/new-folder.svg "New Module").
    - Enter "myMod" as module name. Hit Enter.

    Module is generated in seconds for application `myApp`.

## Create Query Service

> Note: Here we are to create a query service to return a list of customers of complex structure by state.

1. Generate service
    - Move mouse over `myMod` module and click `New Query Service` ![Alt](./dark/query-service.svg "New Query Service").
    - Enter "getCustomersByState" as service name. Hit Enter.

    Service is generated in seconds.

2. Compose input
    - Copy and paste the following into `input.json` file

    ```json
    {
        "state": "CA"
    }
    ```

3. Compose output
    - Copy and paste the following into `output.json` file

    ```json
    [{
        "customernumber": 124,
        "customername": "Mini Gifts Distributors Ltd.",
        "phone": "4155551450",
        "address": {
            "address": "5677 Strong St.",
            "city": "San Rafael",
            "state": "CA",
            "country": "USA"
        },
        "salesRep": {
            "employeenumber": 1165,
            "lastname": "Jennings",
            "firstname": "Leslie",
            "office": "San Francisco-USA"
        },
        "orders": [{
            "ordernumber": 10113,
            "orderdate": "2003-03-26T00:00:00.000Z",
            "status": "Shipped",
            "comments": "shipped on time",
            "orderLines": [
                {
                    "orderlinenumber": 1,
                    "productcode": "S32_3522",
                    "productname": "1996 Peterbilt 379 Stake Bed with Outrigger",
                    "quantityordered": 23,
                    "priceeach": 58.82
                }
            ]
        }]
    }]
    ```

4. Compose query
    - Copy and paste the following into `query.sql` file

    ```sql
    select c.customerNumber, c.customerName, c.phone, 
        c.addressLine1 as address, c.city, c.state, c.country,
        e.employeeNumber, e.lastName, e.firstName, 
        concat(o.city, '-', o.country) as office,
        ord.orderNumber, ord.orderDate, ord.status, ord.comments,
        od.orderLineNumber, p.productCode, p.productName, 
        od.quantityOrdered, od.priceEach
    from customers c, 
        employees e, 
        offices o, 
        orders ord,
        orderdetails od, 
        products p
    where e.employeeNumber = c.salesRepEmployeeNumber
    and o.officeCode = e.officeCode
    and ord.customerNumber = c.customerNumber
    and od.orderNumber = ord.orderNumber
    and p.productCode = od.productCode
    and c.state = :state
    order by c.customerNumber, ord.orderNumber, od.orderLineNumber
    ```

5. Generate input and output Bindings
    - Move mouse over `getCustomersByState` service and click `Generate Input and Output Bindings` ![Alt](./dark/references.svg "Generate Input and Output Bindings") icon.
    - Review and edit input and out bindings if necessary (no change here).

6. Test Service
    - Move mouse over `Tests` folder and click `Add Test` ![Alt](./dark/add.svg "Add Test"), to generate a test file.
    - Review and edit input parameters in `testGetCustomerByState.json` file. Make it looks like:

    ```json
      {
        "name": "getCustomerByState",
        "input": {
            "state": "CA"
        }
      }
    ```

    - click `Run Test` ![Alt](./dark/play.svg "Run Test") button to test the service.

## Create SQL Service

> Note: here we are to creat a SQL command service to clone a product line and its products.

1. Generate service
    - Move mouse over `myMod` module and click `New SQL Service` ![Alt](./dark/sql-service.svg "New SQL Service")
    - Enter "cloneProductLine" as service name. Hit Enter.

    Service is generated in seconds.

2. Compose input
    - Copy and paste the following into `input.json` file

    ```json
    {
        "scourceProductLine": "Classic Cars",
        "newProductLine": "Electric Cars"
    }
    ```

3. Compose the optional output
    - Copy and paste the following into `output.json` file

    ```json
    {
        "productline": "Classic Cars",
        "description": "Make your wildest car ownership dreams come true.",
        "products": [{
            "productcode": "S10_1949",
            "productname": "1952 Alpine Renault 1300",
            "productvendor": "Classic Metal Creations",
            "buyprice": 98.58,
            "msrp": 214.3
        }]
    }    
    ```

4. Compose SQLs
    - Copy and paste the following into `sqls.sql` file

    ```sql
    insert into classicmodels.productlines (
    productLine, textDescription, htmlDescription, image
    )
    select :newProductLine, textDescription, htmlDescription, image
    from classicmodels.productlines
    where productLine = :scourceProductLine
    ;

    insert into classicmodels.products (
    productCode, productName, productLine, productScale, productVendor, productDescription, quantityinStock, buyPrice, MSRP
    )
    select concat('N_', productCode) as productCode, productName, :newProductLine, productScale, productVendor, productDescription, 0, buyPrice, MSRP
    from classicmodels.products
    where productLine = :scourceProductLine
    ;
    ```

5. Compose the optional query
    - Copy and paste the following into `query.sql` file

    ```sql
    select pl.productLine, pl.textDescription as description,
        p.productCode, p.productName, productVendor,
        p.productDescription, buyPrice, MSRP
    from classicmodels.products p, classicmodels.productlines pl
    where p.productLine = pl.productLine
        and p.productLine = :newProductLine
    ```

6. Generate input and output Bindings
    - Move mouse over `cloneProductLine` service and click `Generate Input and Output Bindings` ![Alt](./dark/references.svg "Generate Input and Output Bindings") icon.
    - Review and edit input and out bindings if necessary (skip)

7. Test Service
    - Move mouse over `Tests` folder and click `Add Test` ![Alt](./dark/add.svg "Add Test"), to generate a test file
    - Review and edit input parameters in `test01.json` file
    - click `Run Test` ![Alt](./dark/play.svg "Run Test") button or `Run Test without Commit` ![Alt](./dark/debug-rerun.svg "Run Test without Commit") button to test the service.

## Create CRUD Service

> Note: here we are to create a CRUD service for an aggregate root object Order. For CRUD service, read and write may be asymmetric. You will see in this example, the read operation reads from 4 tables but the write operations only write to 2 tables.

1. Generate service
    - Move mouse over `myMod` module and click `New CRUD Service` ![Alt](./dark/crud-service.svg "New CRUD Service") icon.
    - Enter "Order" as service name. Hit Enter.  

    Service is generated in seconds.

2. Compose object
    - Copy and paste the following into `object.json` file

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
    - Copy and paste the following into `query.sql` file

    ```sql
    select ord.orderNumber, ord.orderDate, ord.status, ord.comments,
           _c.customerNumber, _c.customerName,
           od.orderLineNumber, _p.productCode, _p.productName, 
           od.quantityOrdered, od.priceEach
    from orders ord
    join customers _c on ord.customerNumber = _c.customerNumber
    left join orderdetails od on od.orderNumber = ord.orderNumber
    left join products _p on _p.productCode = od.productCode
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
    - Move mouse over `Order` service and click `Generate Table Bindings` ![Alt](./dark/multiple-windows.svg "Generate Table Bindings") icon;
    - Review and edit tables bindings if necessary (skip).

6. Test Service
    - Move mouse over `Tests` folder and click `Add Test` ![Alt](./dark/add.svg "Add Test"), and select `all` in the opened input box, to generate a test file for each CRUD operation;
    - Review and edit input parameters in the test files.

    For `read` test,
    - Mouse over the `testReadOrder.json` file and click `Duplicate` ![Alt](./dark/add.svg "Duplicate") icon, to duplicate a read test.
    - Rename the two read test files to `testReadOrderByOrderNumber` and `testReadOrderByDatesAndStatus`, repectively.
    - Edit the `testReadOrderByOrderNumber` file and make it looks like:

    ```json
    {
        "name": "testReadOrderByOrderNumber",
        "input": {
            "ordernumber": 123
        },
        "operation": "read"
    }
    ```

    - Edit `testReadOrderByDatesAndStatus` file and make it looks like

    ```json
    {
        "name": "testReadOrderByDatesAndStatus",
        "input": {
            "startDate": "2003-01-06T00:00:00.000Z",
            "startEnd": "2003-01-10T00:00:00.000Z",
            "status": "Shipped",
        },
        "operation": "read"
    }
    ```
    - Run a test for each.

    For `create` test,
    - open `testCreateOrder.json` file, and make it look like:

    ```json
    {
        "name": "create order",
        "input": {
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

    - click `Run Test` ![Alt](./dark/play.svg "Run Test") button to test the service.

## Generate Simple CRUD Services from Database Tables

- Move mouse over `myMod` module, right-click and select `Generate CRUD from Table`
- Select table "productLine" and "office". Hit Enter.

Two simple CRUD services are generated in seconds.

## Deploy Service, Module and Application to DevTime

> The application and module are automatically deployed to DevTime upon creation. The service are automatically deployed to DevTime upon a successful test. However, you deploy a service, a module or a whole application manually anytime as you please. Once deployed, the services are accesible through the DevTime endpoint.

1. Deploy service to DevTime
    - Move mouse over `getCustomersByState` service, righ-click to show a context menu, and select `Deploy Service`, to deploy the service.

2. Deploy module to DevTime
    - Move mouse over `myMod` module, righ-click to show a context menu, and select `Deploy Module`, to deploy the module.

3. Deploy application to DevTime
    - Move mouse over `myApp` application righ-click to show a context menu, and select `Deploy Application`, to deploy the application.

## View and Test and Services Deployed on DevTime

1. View Service

    - Mouse over `DEPLOYMENTS` explorer, and click `Refresh Application List`![Alt](./dark/sync.svg "Refresh Application List") icon.

    A list of application is displayed.

    - Mouse over `myApp` explorer, and click `Refresh Application`![Alt](./dark/sync.svg "Refresh Application") icon.

    A list of services of the applications is displayed.

2. Test Service

    - Mouse over `getCustomersByState` and click `Generate Tests`![Alt](./dark/sync.svg "Generate Tests") icon, to generate a `tests.http` file;
    - Open the `tests.http` file, and click any `Send Request` line you see.

> You must have the [Rest Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension installed, in order to run the tests in the `tests.http` file.
