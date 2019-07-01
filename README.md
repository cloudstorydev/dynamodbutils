# DynamoDbUtils
A simple utility to model, import, query and test your data in your DynamoDB by adopting AWS DynamoDB Data Modelling Best practices (Single Table principle)  
Easily run **Test-First Migration** approach for quick iteration to validate your model against your access pattern

## Prerequisite
  * NodeJS 
  * Run Local DynamoDB https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.DownloadingAndRunning.html

## How to use
  * Go over to index.js and understand the sample code there
  * Update the configuration, and run the sample code 
  * It will import the csv data in northwind folders
  * Run the queries in the sample code to test the import
  * Repeat as many as you like by simply changing table name or use your own data / csv file 

## Step by step

#### Instatiate the utility, and create the table (true in the last param) 
```javascript
const tableName = 'northwind5';
let dynamo = new DynamoUtils (awsConfig,tableName,true); 
```
#### Review the importAll() function and change to include/exclude csv, and set the keys to follow your access pattern
```javascript
 //prepare configuration: where to get the data, what to import
  const dataPath = "./northwind/csv";  //folder of csv to import
  const entities = ['customers','employees','orders','products','suppliers']; //list of entities to import
  const rels = ['order_details']; //list to rel table to import (many to many)
  const dataKeys = {   //what values to be placed in the GSI to match your access pattern
    'customers': ['companyName'],
    'employees': ['lastName','reportsTo'],
    'orders': ['customerID','orderDate'],
    'products': ['supplierID'],
    'suppliers': ['country','city'],
    'order_details': ['quantity']
  }
  const keys = {  //key or id for each entities
    'customers': 'customerID',
    'employees':  'employeeID',
    'orders': 'orderID',
    'products':  'productID',
    'suppliers':  'supplierID',
  }
  
```
#### Run importAll() to start import
```javascript
importAll(dynamo);
```
#### Now the fun part, query your data to test it accomodates your access pattern
```javascript
dynamo.getAll('customers',(result)=>{
  console.log (JSON.stringify(result));
  }
);
```
and many others example in index.js

