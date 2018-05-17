# Overview

This module provides a very simple e-mail sender, which leans heavily on the awesome [nodemailer](https://nodemailer.com/) package.  It layers on the ability to pass in a complete e-mail message with headers and body in one string (or file), and optionally perform placeholder substitution using [substitute()](https://www.npmjs.com/package/pixl-tools#substitute) from the [pixl-tools](https://www.npmjs.com/package/pixl-tools) package.  Auto-detects HTML or plain text e-mail body, and supports custom headers and attachments as well.

# Usage

Use [npm](https://www.npmjs.com/) to install the module:

```
npm install pixl-mail
```

Then use `require()` to load it in your code:

```javascript
var PixlMail = require('pixl-mail');
```

Instantiate a mailer object and pass in the SMTP hostname (defaults to `127.0.0.1`) and the port number (defaults to `25`):

```javascript
var mail = new PixlMail( 'smtp.myserver.com', 25 );
var mail = new PixlMail( '127.0.0.1' );
var mail = new PixlMail();
```

Send mail using the `send()` method.  Pass in the complete e-mail message as a multi-line string including `To`, `From` and `Subject` headers, and a callback:

```javascript
var message = 
	"To: president@whitehouse.gov\n" + 
	"From: citizen@email.com\n" + 
	"Subject: NASA Budget\n" +
	"\n" +  
	"Dear Mr. President,\nPlease give NASA back their money.\n";

mail.send( message, function(err) {
	if (err) console.log( "Mail Error: " + err );
} );
```

For multiple recipients, simply separate them by commas on the `To` line.  You can also specify `Cc` and/or `Bcc` headers, as well as any custom MIME headers.

## Placeholder Substitution

The library supports a simple e-mail templating system, where you can insert `[bracket_placeholders]` in your e-mail message, and have the library fill them with appropriate content from a separate object.  This feature uses the [substitute()](https://www.npmjs.com/package/pixl-tools#substitute) function from the [pixl-tools](https://www.npmjs.com/package/pixl-tools) package.

As an example, imagine a welcome e-mail for a new user who has signed up for your app.  You have the welcome e-mail "template" stored separately, and want to fill in the user's e-mail address, full name and username at sending time.  Here is how to do this:

```javascript
// email template
var message = 
	"To: [email]\n" + 
	"From: support@myapp.com\n" + 
	"Subject: Welcome to My App, [full_name]!\n" +
	"\n" +  
	"Dear [full_name],\nWelcome to My App!  Your username is '[username]'.\n";

// placeholder args
var user = {
	username: "jhuckaby",
	full_name: "Joseph Huckaby",
	email: "jhuckaby@email.com"
};

mail.send( message, user, function(err) {
	if (err) console.log(err);
} );
```

So in this case our e-mail template has several placeholders, including `[email]`, `[full_name]` and `[username]`.  These are pulled from the `user` object which is passed to `send()` as the 2nd argument.  So the final e-mail that would be sent is:

```
To: jhuckaby@email.com
From: support@myapp.com
Subject: Welcome to My App, Joseph Huckaby!

Dear Joseph Huckaby,
Welcome to My App!  Your username is 'jhuckaby'.
```

You can actually use a complex hash / array tree of arguments, and then specify `[/filesystem/style/paths]` in your placeholders.  See the [substitute()](https://www.npmjs.com/package/pixl-tools#substitute) docs for details.

## Loading From Files

You can specify a file path instead of the raw message, like this:

```javascript
var user = {
	username: "jhuckaby",
	full_name: "Joseph Huckaby",
	email: "jhuckaby@email.com"
};

mail.send( "conf/emails/new_user_welcome.txt", user, function(err) {
	if (err) console.log(err);
} );
```

## Attachments

To attach files, include an `attachments` array in your `args` object, and specify a `filename` and `path` for each one.  This is passed directly to [nodemailer](https://nodemailer.com/), so you can use all of their attachment features.  Example:

```javascript
var args = {
	attachments: [
		{ filename: "contract.pdf", path: "files/contracts/4573D.PDF" },
		{ filename: "policy.pdf", path: "files/misc/POLICY-2015.PDF" }
	]
};

mail.send( message, args, function(err) {
	if (err) console.log( "Mail Error: " + err );
} );
```

For details, see the [Attachments](https://nodemailer.com/message/attachments/) section in the [nodemailer](https://nodemailer.com/) docs.

## HTML Emails

If you want to send HTML formatted e-mails, the library will automatically detect this.  Just provide the headers in plain text, two end-of-lines, then start your HTML markup.  Example:

```javascript
var message = 
	"To: president@whitehouse.gov\n" + 
	"From: citizen@email.com\n" + 
	"Subject: NASA Budget\n" + 
	"\n" + 
	"<h1>Dear Mr. President,</h1>\n<p><b>Please</b> give NASA back their <i>money</i>.</p>\n";

mail.send( message, function(err) {
	if (err) console.log( "Mail Error: " + err );
} );
```

**Note:** Your e-mail body must begin with an HTML tag for it to be recognized.

## Options

You can set a number of options using the `setOption()` or `setOptions()` methods.  These are passed directly to the underlying [nodemailer](https://nodemailer.com/) module, so please check out their documentation for details.  Examples include setting timeouts, SSL, and authentication.

The `setOption()` method takes one single key/value to set or replace, while `setOptions()` accepts an object containing multiple keys/values.

```javascript
mail.setOption( 'secure', true ); // use ssl
mail.setOption( 'auth', { user: 'fsmith', pass: '12345' } );

mail.setOptions({
	connectionTimeout: 10000, // milliseconds
	greetingTimeout: 10000, // milliseconds
	socketTimeout: 10000 // milliseconds
});
```

You can also use local [sendmail](https://nodemailer.com/transports/sendmail/), if you have that configured on your server.  To do this, set the following options, and tune as needed:

```js
mail.setOptions({
	"sendmail": true,
	"newline": "unix",
	"path": "/usr/sbin/sendmail"
});
```

# License

The MIT License (MIT)

Copyright (c) 2015 - 2017 Joseph Huckaby.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
