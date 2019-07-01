
/**
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

The views and conclusions contained in the software and documentation are those
of the authors and should not be interpreted as representing official policies,
either expressed or implied, of the cloudstory project.
 */


const DynamoUtils = require ('./DynamoUtils');
 



const awsConfig =  {
  region: 'local',
  endpoint: 'http://localhost:8000'
}
 
const csv=require('csvtojson')


importAll = function (dynamo) {
   
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
  

  //import base entities
  console.log ('importing base entities');
  entities.forEach(entity=>{
    csv()
    .fromFile(`${dataPath}/${entity}.csv`)
    .then((objs)=>{
      console.log ('======== importing ' + entity + ' ============ ');
      dynamo.importEntity(entity,keys[entity],dataKeys[entity],objs,(result)=>{
        console.log (JSON.stringify(result));
      })
    })
  })

  //import rels entities
  console.log ('importing rel entities');
  rels.forEach(entity=>{
    csv()
    .fromFile(`${dataPath}/${entity}.csv`)
    .then((objs)=>{
      console.log ('======== importing ' + entity + ' ============ ');
       const from = {
         name: 'orders',
         key: 'orderID'
       } 
       const to = {
        name: 'products',
        key: 'productID'
      } 
       dynamo.importManyToMany(from,to,dataKeys[entity], objs,  (result)=>{
         console.log (JSON.stringify(result));
       })
    })
  })
} 


//set what table to work on
const tableName = 'northwind5';
//create util instance, and set the config, table name, create new table (true/false)
let dynamo = new DynamoUtils (awsConfig,tableName,false);

//import all the csv, this only be done once
//wait until table created before running this
/*  
importAll(dynamo);
*/ 

//following command below are queries to support your access pattern below
//wait until import successful before running any queries

//get all records for an entity
dynamo.getAll('customers',(result)=>{
  console.log (JSON.stringify(result));
  }
);
 

//get entity by its ID 
dynamo.getByKey('customers','ANTON',(result)=>{
  console.log (JSON.stringify(result));
  }
);

 

 
 
//get all products by orderID 
var from = {
  name: 'orders',
  key: '10248'
} 
var to = {
 name: 'products',
 key: 'productId'
} 
dynamo.getManyFrom(from,to,(result)=>{
  console.log (JSON.stringify(result));
  }
);


 
//get all orders by productID 
var from = {
  name: 'orders',
  key: 'orderID'
} 
var to = {
 name: 'products',
 key: '72'
} 
dynamo.getManyTo(from,to,(result)=>{
  console.log (JSON.stringify(result));
  }
);
 
  
//support more access pattern with query to data. It only support begins_with operator
//get orders by customers + date
dynamo.getByData('orders','WELLI#1996-07-15',(result)=>{
  console.log (JSON.stringify(result));
  }
);
 

//get suppliers by country / city
dynamo.getByData('suppliers','Japan#Tokyo',(result)=>{
  console.log (JSON.stringify(result));
  }
);
 
 
 
//full flexibility with query on attributes, this is less efficient due to non-index attrib
//get order older than a date
dynamo.getByAttr('orders','orderDate','<','1996-07-22',(result)=>{
  console.log (JSON.stringify(result));
  }
);

 
 

 

 