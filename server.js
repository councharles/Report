var express = require("express");
var app = express();
var serveindex = require("serve-index");
var fs = require("fs");
var path = require("path");
var server = require("http").createServer(app);
var io = require("socket.io")(server, {
  pingInterval: 3000,
  pingTimeout: 7000
});
var SSHClient = require("ssh2").Client;

// Load static files into memory
app.use("/", express.static(__dirname + "/"));
app.use("/logs", serveindex("logs", { icons: true }));
function logsession(info) {
  var logging = fs.createWriteStream(`/logs/${Date.now()}.log`);
  var mylog = new Console(logging);
  mylog.log(info);
}
io.on("connection", function(socket) {
  console.log("connected ");
  socket.emit("connect", "\r\n*** SSH CONNECTION ESTABLISHED ***\r\n");
  var conn = new SSHClient();
  conn
    .on("ready", function() {
      socket.emit("data", "\r\n*** SSH CONNECTION ESTABLISHED ***\r\n");
      conn.shell({ term: "xterm-256color" }, function(err, stream) {
        if (err)
          return socket.emit(
            "data",
            "\r\n*** SSH SHELL ERROR: " + err.message + " ***\r\n"
          );
        socket.on("login to node", data => {
          stream.write(data);
        });

        socket.on("userid", data => {
          stream.write(data);
        });

        socket.on("data", function(data) {
          stream.write(data);
        });

        stream
          .on("data", function(d) {
            socket.emit("data", d.toString("binary"));
          })
          .on("close", function() {
            conn.end();
          });
      });
    })
    .on("close", function() {
      socket.emit("disconnected", "\r\n*** SSH CONNECTION CLOSED ***\r\n");
    })
    .on("error", function(err) {
      socket.emit(
        "error",
        "\r\n*** SSH CONNECTION ERROR: " + err.message + " ***\r\n"
      );
    })
    .connect({
      host: "192.168.15.71",
      username: "dcn",
      password: "Challenges@1"
      //privateKey: 'db:31:59:0a:b3:49:33:1e:68:f6:04:a3:4b:b6:6a:61'
    });
});
server.listen(4000);
