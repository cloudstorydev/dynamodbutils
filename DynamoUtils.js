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

const AWS = require('aws-sdk');

const  query = function (params, callback) {
  console.log (params)
  docClient.query(params, (err, data)=> {
    if (err) {
      console.log (  err );
      callback({status:'ERROR',data: err })
    }  
    else {
      console.log (  data );
      callback({status:'SUCCESS',data: data })
    }
  });
}
const  put = function (params, callback) {
  console.log (params)
  docClient.put(params, (err, data)=> { 
    if (err)  
      callback({status:'ERROR',data: err })
    else {
      callback({status:'SUCCESS',data: data })
    }
 
  });
}

const getDataField = function (row,dataKeys) {
  let dataArr = [];
  dataKeys.forEach(dataKey=>{
    dataArr.push( `${dataKey}=${row[dataKey]}`); 
  })
  return  dataArr.toString() 
}

const createTable = function (name) {
  var params = {
    AttributeDefinitions: [
       {
      AttributeName: "PK", 
      AttributeType: "S"
     }, 
       {
      AttributeName: "SK", 
      AttributeType: "S"
     },
     {
      AttributeName: "DATA", 
      AttributeType: "S"
     }
    ], 
    KeySchema: [
       {
      AttributeName: "PK", 
      KeyType: "HASH"
     }, 
       {
      AttributeName: "SK", 
      KeyType: "RANGE"
     }
    ], 
    GlobalSecondaryIndexes: [
      {
        IndexName: 'GSI',  
        KeySchema: [ 
          {
            AttributeName: 'SK',  
            KeyType: 'HASH'  
          },
          {
            AttributeName: 'DATA',  
            KeyType: 'RANGE'  
          }
        ],
        Projection: {  
          ProjectionType: "ALL"  
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,  
          WriteCapacityUnits: 5  
        }
      },
  
    ],
    ProvisionedThroughput: {
     ReadCapacityUnits: 5, 
     WriteCapacityUnits: 5
    }, 
    TableName: name
   };
   db.createTable(params, function(err, data) {
    if (err) throw err;
    else  console.log (data)  
   });
}    
 
var docClient = {};
var db =  {};

function DynamoUtils(awsConfig,tableName,create=false) {
  
  AWS.config.update(awsConfig);
  docClient = new AWS.DynamoDB.DocumentClient();
  db = new AWS.DynamoDB();

  this.tableName = tableName; 
  if (create) {
    createTable (tableName);
  }
}


DynamoUtils.prototype.importEntity = function importEntity ( name, key , dataKeys, json ,callback ) {
   
  json.forEach(row=>{
    let params = {
      TableName : this.tableName,
      Item:{
        'PK' : `${name}#${row[key]}`,
        'SK' : name,
        'DATA' : getDataField(row,dataKeys)
      }
    };
    //copy other attribs as additional fields
    const rowKeys = Object.keys(row);
    rowKeys.forEach (rowKey=>{
      params.Item[rowKey] = row[rowKey];
    });
    put (params,callback);

  });
};
 
 
DynamoUtils.prototype.importManyToMany = function importManyToMany (from, to, dataKeys, json,callback ) {
  const keys = Object.keys (json);
  json.forEach(row=>{
    
    let params = {
      TableName : this.tableName,
      Item:{
        'PK' :  `${from.name}#${row[from.key]}`,
        'SK' :  `${to.name}#${row[to.key]}`,
        'DATA' : getDataField(row,dataKeys)
      }
    };
     //copy other attribs as additional fields
    const rowKeys = Object.keys(row);
    rowKeys.forEach (rowKey=>{
      if (rowKey!=='fromKey' && rowKey!=='toKey')
        params.Item[rowKey] = row[rowKey]; 
    });
    
    put (params,callback);
    
  });
};

 
DynamoUtils.prototype.getAll = function getAll (name,callback) {

  let params = {
    TableName: this.tableName,
    IndexName: 'GSI',
    KeyConditionExpression:  `SK = :pk` ,
    ExpressionAttributeValues: {
      ':pk': name,
    }
  }
  query(params,callback)   
};

DynamoUtils.prototype.getByKey = function getByKey (name,key,callback) {

  let params = {
    TableName: this.tableName,
    KeyConditionExpression:  `PK = :pk` ,
    ExpressionAttributeValues: {
      ':pk':  `${name}#${key}`,
    }
  }
  query(params,callback)   
};



DynamoUtils.prototype.getManyFrom = function getManyFrom (from, to, callback) {
  let params = {
    TableName: this.tableName,
    KeyConditionExpression:  `#pk = :pk AND begins_with(#sk,:sk) ` ,
    ExpressionAttributeNames: {"#pk": "PK" ,'#sk':'SK'},
    ExpressionAttributeValues: {
      ':pk': `${from.name}#${from.key}`,
      ':sk': `${to.name}`
    }
  }     
  query(params,callback)  
}; 

DynamoUtils.prototype.getManyTo = function getManyTo (from, to,callback) {
  let params = {
    TableName: this.tableName,
    IndexName:  'GSI',
    KeyConditionExpression:  `SK = :sk` ,
    ExpressionAttributeValues: {
      ':sk': `${to.name}#${to.key}`
    }
  }
  query(params,callback)  
}; 

//eg: data = 'supplierId=12345'
DynamoUtils.prototype.getByData = function getByData (name,data,callback) {
  let params = {
    TableName: this.tableName,
    IndexName: 'GSI',
    KeyConditionExpression:  `#sk = :sk AND begins_with (#data, :data) ` ,
    ExpressionAttributeNames: {"#sk": "SK" ,'#data':'DATA'},
    ExpressionAttributeValues: {
      ':sk': name,
      ':data': data
    },
 
   /*
    KeyConditions: {
      'DATA': {
        ComparisonOperator: 'CONTAINS',
        AttributeValueList: 
          { 
            S: data
            
          }
        },
        'SK': {
          ComparisonOperator: 'EQ',
          AttributeValueList: 
            { 
              S: name
              
            }
          },   
      } */
  }
  query(params,callback)  
}; 

DynamoUtils.prototype.getByAttr = function getByAttr (name,attrName,attrOper,attrValue,callback) {
  let params = {
    TableName: this.tableName,
    IndexName: 'GSI',
    FilterExpression: `#cat ${attrOper} :cat`,
    KeyConditionExpression:  `SK = :pk` ,
    ExpressionAttributeNames: {
        '#cat': attrName,
    },
    ExpressionAttributeValues: {
        ':cat': attrValue,
        ':pk': name,
    }, 
  };
  query(params,callback)
} 


module.exports =  DynamoUtils ;




