var http = require('http');
var fs = require('fs'); // file-system
var url = require('url'); // 解析url
var req = require('request');

// 创建服务
// request 存别人发过来的请求/参数
// response 对发过来的请求设置返回一些响应信息
// 每一个服务至少占用一个端口。
// 加载页面访问 http://127.0.0.1:12306（也叫作域）
// 我发送的请求也是 http://127.0.0.1:12306（域）
// 域没变，所以没有跨域。
http.createServer(function (request, response) {
	// 静态资源服务器
	// url 解析出一堆参数出来
	// 解析路径名 url.parse(request.url) 是个对象
	var pathName = url.parse(request.url).pathname;
	console.log(pathName); // /robot.html /robot.css /favicon.ico
	if (isStaticRequest(pathName)) {
		// 如果是静态的(资源)，就返回页面
		// 做异常捕获 - 如果访问的路径不存在，就捕获返回 404响应头 及 响应信息
		try {
			// 页面的本质就是一个字符串
			// 这个特殊的字符串是存储在服务器的.
			// 那么用什么来存储呢?用文件来存储.
			// 读取./page下的所有文件（html/css/jpg等资源）
			var data = fs.readFileSync('./page' + pathName);
			// console.log(data.toString()); // robot.html 的页面字符串
			// 把 data 字符串(文件)返回给页面，页面就可以显示了。
			response.writeHead(200);
			response.write(data); // 这时候访问这个地址端口就可以看到页面了。
			response.end();
		} catch (err) {
			response.writeHead(404);
			response.write('<html><body><h1>404 NotFound</h1></body></html>');
			response.end();
		}
	} else {
		// 如果是动态的(资源)，就给 图灵api 发送请求
		console.log('请求数据接口')
		// 不传true 解析出来的是 一个字符串的参数
		var params = url.parse(request.url, true).query; // .query 解析路径的参数
		// 向图灵API 发出请求
		var data = {
			"reqType":0,
			"perception": {
				"inputText": {
					"text": params.text
				}
			},
			"userInfo": {
				"apiKey": "fccd7a0880c048a1b34238f73988e9f8",
				"userId": "123456"
			}
		}
		// 发送 HTTP请求
		// 参数一： 请求  参数二： 回调
		req({
			// url
			url: 'http://openapi.tuling123.com/openapi/api/v2',
			method: 'POST', // 请求方式
			headers: {
				'content-type': 'application/json' // 传送的数据是json格式
			},
			body: JSON.stringify(data) // post往外发的时候，得转成字符串
		}, function (err, resp, body) {
			if (!err && resp.statusCode == 200) {
				console.log(body); // 一串json
				// 拿到 请求结果
				var obj = JSON.parse(body); // 转为对象
				if (obj && obj.results && obj.results.length > 0 && obj.results[0].values) {
					// 返回给页面
					response.writeHead(200)
					response.write(JSON.stringify(obj.results[0].values)) // 得转化为字符串
					response.end()
				}
			}
		})
		
	}
}).listen(12306);

// 判断是否为请求静态资源
function isStaticRequest (pathName) {
	var staticFileList = [".html", ".css", ".js", ".jpg", ".jpeg", ".png"];
	for (var i = 0; i < staticFileList.length; i++) {
		// 防止出现这样的文件的读取 /robot.html.abc
		// 必须在结尾  /robot.html - .html = /robot后开始的位置 === .indexOf() 的起始位置
		if (pathName.indexOf(staticFileList[i]) == pathName.length - staticFileList[i].length) {
			return true
		}
	}
	return false
}