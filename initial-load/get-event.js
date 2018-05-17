var Client = require('node-rest-client').Client;
var client = new Client();
let cronicleHost = 'http://localhost:3012';
let session_id;
let headers = {
  'Accept': 'text/plain, */*; q=0.01',
  'Accept-Encoding': 'gzip, deflate',
  'Content-Type': 'text/plain',
  'Content-Type': 'application/json'
};
let loginArgs = {
  headers : headers ,
  data : {
    password:'admin',
    username:'admin'
  }
};
client.post(`${cronicleHost}/api/user/login`, loginArgs, (data, response) =>  {
  if(response.statusCode === 200){
    console.log(`Login success , session id : ${data.session_id}`)
    session_id = data.session_id;
    createApiKey();
  }else{
    console.error('Login failed');
  }

});


function createApiKey(){
  let key = '639c43a89de343ef34f9457aacb8b5e7';
  console.log(`Create api key with value ${key}`);
  let updatePluginArgs = {
    headers : headers ,
    data : {
      active:  '1',
      description :  '',
      key :  key ,
      privileges  :  {admin: 0, create_events: 1, edit_events: 1, delete_events: 1, run_events: 1, abort_events: 1 , state_update : 1},
      title  :  'Microservices',
      session_id: session_id
    }
  };
  client.post(`${cronicleHost}/api/app/create_api_key`, updatePluginArgs, (data, response) =>  {
    console.log(`API key creation status ${response.statusCode}`);
  });

}
