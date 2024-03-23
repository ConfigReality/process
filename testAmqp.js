var amqp = require('amqplib/callback_api');
var dotenv = require('dotenv');
var supabase = require('@supabase/supabase-js');
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

amqp.connect(process.env.QUEUE_CONNECTION_STRING, function(error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function(error1, channel) {
    if (error1) {
      throw error1;
    }
    var queue = 'processing';

    channel.assertQueue(queue, {
      durable: false
    });
    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);
    channel.consume(queue, async function(msg) {
        console.log(" [x] Received %s", msg.content.toString());
        // await supabaseClient.from('Process').delete().eq('id', msg.content.toString());
    }, { noAck: false });
  });
});