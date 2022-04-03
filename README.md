# Service Builder

The rapid development tool for data access services. The true SQL-first approach to relational data access.

# Features

This extension adds two tree views to the built-in vscode explorer.

- Service Builder  - the tool for developing data access applications
  - Connect to BackLogic workspace
  - Create data access application
  - Cretea data access module
  - Create data access services
  - Deploy data access application, module and sevices to DevTime

- Service Explorer - the tool for exploring applications deployed on Service DevTime
  - View applications deployed on Service DevTime
  - Test services deployed on Service DevTime, and
  - Clean up application, module and services deployed on Service DevTime

# BackLogic Workspace

![BackLogic Workspace](./resources/images/backlogic-workspace.svg)

The Service Builder must connect to a BackLogic workspace to work. The BackLogic workspace is a virtual private develpment environment hosted in BackLogic cloud.  

Inside the workspace are a Service Builder Backend and a Service DevTime. The Service Builder Backend helps connect to the user DEV database for DB meta data and deploy data access services to the Service DevTime. The Service DevTime runs the data access applications in the workdpace and provides data access to the DEV database at the service endpoint of the workspace.  

The Service Builder automatically deployes the application and module to Service DevTime upon creation, and deployes the service upon a successful test.

# Usage

Use Service Builder to build data access application, and Service Explorer to explore applications deployed on Service DevTime.

# Install

Press F1, type ext install then search for service-builder.

# Get Started with Service Builder

This is a quick walk-through of the steps for creating a data access application. It assums that the data source is the `classicmodels` MySQL database for `MySQL tutorial`. The ER diagram for this database is [here](https://www.mysqltutorial.org/mysql-sample-database.aspx).

## Connect To BackLogic Workspace

- Move mouse over `Service Builder` in EXPLORER and click `More Actions` icon and select `Connect`.
- Paste your workspace URL in the input box opened, and hit Enter
- Paste you access code in the next input box opened, and hit Enter

> You have a BackLogic workspace automatically created for you when you sign up from BackLogic Service Console. You may get your workspace URL and access token from there.

## Create Application

- Move mouse over `Service Builder` and click `New Application` ![Alt](./resources/dark/new-folder.svg "New Application")
- Enter "myApp" as application name. Hit Enter.
- Select "mysql" as database type.  Hit Entry.  

## Configue Data Source

- Move mouse over `myApp` and click `Config Data Source` ![Alt](./resources/dark/database.svg "Config Data Source"), to open datasource.json
- Edit url, username and password fields in `datasource.json` openned in editor
- Click `Test Data Source Configuration` ![Alt](./resources/dark/play.svg "Test Data Source Configuration") button to test database connection
- Click `Save and Apply Data Source Configuration` ![Alt](./resources/dark/save-all.svg "Save and Apply Data Source Configuration") button to save and apply data source configuration to workspce

> Service Buider access your DEV database through a NAT server in BackLogic cloud. The public IP address for this NAT server is 10.0.0.0. You may need to whitelist this IP address, if your database is protected by a security group.

## Create Module

- Move mouse over `myApp` application and click `New Module` ![Alt](./resources/dark/new-folder.svg "New Module")
- Enter "myMod" as module name. Hit Enter.

## Create Services

- Query Service

  Query service is for retriving data from data source. Detailed steps are [here](#creating-query-service).

- SQL Service

  SQL service is for manipulating data in data source. Detailed steps are [here](#creating-sql-service).

- CRUD Service

  CRUD service is for CRUD operation of aggregate objects. Detailed steps are [here](#creating-crud-service).

## Try without Signup

- Move mouse over `Service Builder` in EXPLORER and click `More Actions` icon and select `Try without Signup`.

> Service Builder will automatically connect you to a quest workspace, create an application, configure a MySQL data source, and create a module for you, so that you can proceed with creating the query, sql and crud services.

## Creating Query Service

> Here we are to create a query service to return a list of customers by state.

1. Generate service

    - Move mouse over `myMod` module and click `New Query Service` ![Alt](./resources/dark/window.svg "New Query Service")
    - Enter "getCustomersByState" as service name. Hit Enter.

    Service is generated in seconds.

2. Compose input
    - Copy and paste the following into the `input.json` file

    ```json
    {
        "state": "CA"
    }
    ```

3. Compose output
    - Copy and paste the following into the `output.json` file

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

    - Move mouse over `getCustomersByState` service and click `Generate Input and Output Bindings` ![Alt](./resources/dark/references.svg "Generate Input and Output Bindings")
    - Review and edit input and out bindings if necessary (no change here)

6. Test Service
    - Move mouse over `Tests` folder and click `Add Test` ![Alt](./resources/dark/add.svg "Add Test"), to generate a test file
    - Review and edit input parameters in `test01.json` file. Make it looks like:

      ```json
        {
            "name": "get customer by state",
            "input": {
                "state": "CA"
            }
        }
      ```

    - click `Run Test` ![Alt](./resources/dark/play.svg "Run Test") button to test the service

## Creating SQL Service

> Note: here we are to creat a SQL command service to clone a product line and its products.

1. Generate service
    - Move mouse over `myMod` module and click `New SQL Service` ![Alt](./resources/dark/server-process.svg "New SQL Service")
    - Enter "cloneProductLine" as service name. Hit Enter.

    Service is generated in seconds.

2. Compose input
    - Copy and paste follwoing into `input.json` file

    ```json
    {
        "scourceProductLine": "Classic Cars",
        "newProductLine": "Electric Cars"
    }
    ```

3. Compose output
    - Copy and paste follwoing into `output.json` file

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
    productCode, productName, productLine, productScale, productVendor, productDescription, quantityinStock, buyPrice, MSRP
    )
    select concat('N_', productCode) as productCode, productName, :newProductLine, productScale, productVendor, productDescription, 0, buyPrice, MSRP
    from classicmodels.products
    where productLine = :scourceProductLine
    ;
    ```

5. Compose optional query

    - Copy and paste follwoing into `query.sql` file

    ```sql
    select pl.productLine, pl.textDescription as description,
        p.productCode, p.productName, productVendor,
        p.productDescription, buyPrice, MSRP
    from classicmodels.products p, classicmodels.productlines pl
    where p.productLine = pl.productLine
        and p.productLine = :newProductLine
    ```

6. Generate input and output Bindings
    - Move mouse over `cloneProductLine` service and click `Generate Input and Output Bindings` ![Alt](./resources/dark/references.svg "Generate Input and Output Bindings")
    - Review and edit input and out bindings if necessary (skip)

7. Test Service
    - Move mouse over `Tests` folder and click `Add Test` ![Alt](./resources/dark/add.svg "Add Test"), to generate a test file
    - Review and edit input parameters in `test01.json` file
    - click `Run Test` ![Alt](./resources/dark/play.svg "Run Test") button to test the service

## Creating CRUD Service

> Note: here we are to create a CRUD service for an aggregate root object Order. For CRUD service, read and write may be asymmetric. You will see in this example, the read operation reads from 4 tables but the write operations only write to 2 tables.

1. Generate service
    - Move mouse over `myMod` module and click New CRUD Service ![Alt](./resources/dark/symbol-method.svg "New CRUD Service")
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
    - Move mouse over `Order` service and click `Generate Input and Output Bindings` ![Alt](./resources/dark/references.svg "Generate Input and Output Bindings")
    - Review and edit input and out bindings if necessary (skip)

5. Generate table bindings
    - Move mouse over `Order` service and click `Generate Table Bindings` ![Alt](./resources/dark/multiple-windows.svg "Generate Table Bindings")
    - Review and edit tables bindings if necessary (skip)

6. Test Service
    - Move mouse over `Tests` folder and click `Add Test` ![Alt](./resources/dark/add.svg "Add Test"), to generate a test file
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

    - Move mouse over `Tests` folder and click `Add Test` ![Alt](./resources/dark/add.svg "Add Test"), to generate another test file
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

    - click `Run Test` ![Alt](./resources/dark/play.svg "Run Test") button to test the service

## Generate Simple CRUD Service from Database Tables

- Move mouse over `myMod` module, right-click and select `Generate CRUD from Table`
- Select table "classicmodel.productLine" and "classicmodel.office". Hit Enter.

Two simple CRUD services are generated in seconds.

## Deploy Service, Module and Application to DevTime

You may deploy a service, a module or a whole application to DevTime as you please. Once deployed, the services are accesible through the DevTime endpoint.

1. Deploy service to DevTime
    - Move mouse over `getCustomersByState` service and click `Deploy Service` ![Alt](./resources/dark/sync.svg "Deploy Service"), to deploy service `getCustomersByState`.

2. Deploy module to DevTime
    - Move mouse over `myMod` module and click `Deploy Module` ![Alt](./resources/dark/sync.svg "Deploy Module"), to deploy module `myMod`.

3. Deploy application to DevTime
    - Move mouse over `myApp` application and click `Deploy Application` ![Alt](./resources/dark/sync.svg "Deploy Application"), to deploy application `myApp`.

# Get Started with Service Explorer

This is a quick walk-through of things you can do with Service Explorer.

## List Applications Deployed on DevTime

## Test a Service

> Requires REST Client extension

## Clean Up Applications on DevTime


# Tips

# Deep Dives




# Release Notes

Users appreciate release notes as you update your extension.

## 1.0.0

Initial release.

## 1.0.1

Fixed issue #.

## 1.1.0

Added features X, Y, and Z.

# Publishing Extension

### Instruction  

<https://code.visualstudio.com/api/working-with-extensions/publishing-extension>

### Commands  

vsce package  
vsce publish  

## Service Deployment

### File Structure

```sh
workspace-folder/
    .deployment/
        my-app/
            application
            my-mod/
                module
                my-service/
                    service
                    tests.http
```

### Actions

#### Refresh

- refresh application list, on title bar  
    reload application list
- refresh application, on application bar  
    reload application structure
- refresh tests, on service bar  
    redload tests.http

#### Clean

- clean workspace, on title bar more menu
- clean application, on application bar context menu
