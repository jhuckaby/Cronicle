# Overview

The JavaScript language already supports object orientated programming, but the syntax is strange and inheritance is wonky.  This library is provided as a means to create classes in a more classical sort of way, including support for static class members, proper constructors, inheritance, and mixins.

# Usage

Use [npm](https://www.npmjs.com/) to install the module:

```
npm install pixl-class
```

Then use `require()` to load it in your code:

```javascript
var Class = require('pixl-class');
```

Then call `Class.create()` to create classes.  See the next section for details.

## Creating Classes

Here is how you create a class using the framework.  You'll notice this is dramatically different than the traditional JavaScript prototype syntax.

```javascript
var Animal = Class.create({
	
	// class member variables
	nickname: '',
	color: '',
	
	// class constructor
	__construct: function(new_name, new_color) {
		this.nickname = new_name;
		this.color = new_color;
	},
	
	// methods
	getInfo: function() {
		return("Nickname: " + this.nickname + "\nColor: " + this.color);
	}
	
});
```

This defines a class called `Animal`, with two member variables, `nickname` and `color`, a constructor and a `getInfo()` method which returns the nickname and color.  You'll notice that to define the constructor method you use the keyword `__construct` which is exactly the same in PHP.  Usage of this class is exactly what you would expect:

```javascript
var dog = new Animal('Spot', 'Green');
console.log( dog.getInfo() );
```

Of course, you can also access the class member variables, as all members are public.

```javascript
dog.nickname = 'Skippy';
dog.color = 'Blue';
console.log( dog.getInfo() );
```

## Creating Subclasses

To create a subclass that inherits from a base class, use the following syntax:

```javascript
var Bear = Class.create({
	
	// inherit from Animal
	__parent: Animal,
	
	// define a new member variable
	wants: 'Honey',
	
	// and a new method
	roar: function() {
		console.log("Roar!  Give me " + this.wants + "!");
	}
	
});
```

This defines a `Bear` class which inherits from the base `Animal` class, including its constructor.  Notice that we passed the parent class as a reference, not a string.  What we did is extend the base class by introducing a new member variable `wants`, and a new method `roar()`.  Everything else from the base class will be present in subclass instances.

```javascript
var grizzly = new Bear('Fred', 'Brown');
console.log( grizzly.getInfo() );

grizzly.wants = 'blood';
grizzly.roar();
```

## Calling Superclass methods

You can also explicitly invoke a superclass method, in order to extend its functionality:

```javascript
var Bear = Class.create({
	__parent: Animal,
	wants: 'Honey',
	roar: function() { console.log("Roar!  Give me " + this.wants + "!"); },
	
	// override base class method
	getInfo: function() {
		// first, get info from base class
		var info = Animal.prototype.getInfo.call(this);
		
		// append bear info and return combined info
		info += "\nWants: " + this.wants;
		return info;
	}
	
});
```

So here we are overriding the base class `getInfo()` method, but the first thing we do is call the superclass method of the same name.  This is done using the `Animal.prototype` syntax, which points to the parent class prototype object.  The JavaScript `call()` method allows you to call a function in object context (hence we are passing in the `this` keyword to it).

Invoking a superclass constructor is even easier, as the class variable *is* the constructor:

```javascript
var Bear = Class.create({
	
	__parent: Animal,
	wants: 'Honey',
	
	// override base class constructor
	__construct: function(new_name, new_color, new_wants) {
		// invoke superclass constructor to set name and color
		Animal.call(this, new_name, new_color);
		this.wants = new_wants;
	}
	
	// and a new method
	roar: function() {
		alert("Roar!  Give me " + this.wants + "!");
	}
	
});
```

We don't provide a fancy way to access the parent class, because that would dirty up instance objects.  Instead, we went for the clean approach.  Your instance objects are pure, and not littered with any special case properties.

## Static Members

You can define static class members (variables or methods) by using the `__static` keyword.  These members do not become part of class instances, but instead live inside the class reference object, and must be accessed that way too.  Example class definition:

```javascript
var Beer = Class.create({
	
	// static members
	__static: {
		types: ['Lager', 'Ale', 'Stout', 'Barleywine']
	},
	
	// class member variables
	nickname: '',
	type: '',
	
	// class constructor
	__construct: function(new_name, new_type) {
		this.nickname = new_name;
		
		if (!Beer.types.indexOf(new_type) == -1) throw("Type not known: " + new_type);
		this.type = new_type;
	},
	
	// methods
	getInfo: function() {
		return("Nickname: " + this.nickname + "\nType: " + this.type);
	}
	
});
```

Here we define a `Beer` class which has a static member defined in the `__static` element.  Anything placed there will *not* be propagated to class instances, and must be accessed using the class reference variable instead (e.g. `Beer` in the above example).  As you can see in the constructor, we are checking the new type against the `types` array which is declared static, so we are getting to the list by using the syntax: `Beer.types` rather than `this.types`.

If you were to change `Beer.types` later on, then *all* classes would see the changes instantly.  The content is effectively shared.

## Mixins

You can define "mixin" classes using the `__mixins` keyword.  This will import all the variables, methods and static members from the specified classes, excluding constructors.  Example:

```javascript
var Liquid = Class.create({
	flavor: "sweet"
});

var Glass = Class.create({
	size: 8
});

var Soda = Class.create({
	
	__mixins: ['Liquid', 'Glass'],
	
	drink: function() {
		console.log("Yum, " + this.size + " oz of " + this.flavor + " drink!");
	}
	
});
```

So in this example, we are importing all the variables and methods of the `Liquid` and `Glass` classes into our `Soda` class.  Then, they are accessible using the normal `this` keyword, as if they were defined in the class.

Note that mixin properties will *only* be imported if they aren't already defined in your class.  Meaning, they will not clobber any existing class members.

## EventEmitters

All classes generated with `Class.create()` are event emitters by default.  Meaning, they all have methods such as `on()`, `once()`, and `emit()`.  Basically they inherit all the methods from Node's [EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter) class, and can use them directly, as shown in this example:

```javascript
var Party = Class.create({
	
	start: function() {
		console.log("Let's get this party started!");
		this.emit('dance');
	}
	
});

var birthday = new Party();
birthday.on('dance', function() {
	console("I'm dancing!");
} );
birthday.start();
```

If you don't want your classes to inherit from `EventEmitter`, simply declare an `__events` property and set it to false.

```javascript
var Party = Class.create({
	
	// do not inherit from EventEmitter
	__events: false,
	
	start: function() {
		console.log("Let's get this party started!");
	}
	
});
```

## Async/Await

Node.js v8 introduced native support for the [async](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)/[await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await) pattern.  If your class has callback-based methods that you want to auto-convert into [promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) for async/await, simply declare a `__promisify` property, and set it to true:

```js
var Sleeper = Class.create({
	
	// promisify all methods
	__promisify: true,
	
	sleep: function(ms, callback) {
		// sleep for N milliseconds, then fire callback
		setTimeout( function() { callback(false); }, ms );
	}
	
});
```

This will wrap all your methods with Node's [util.promisify](https://nodejs.org/api/util.html#util_util_promisify_original), making them instantly ready for async/await.  Example usage:

```js
var snooze = new Sleeper();

async function main() {
	await snooze.sleep( 1000 ); // waits for 1 second here
	console.log("This happened 1 second later!");
};

main();
```

If you only want *some* of your methods to be promisified, set the `__promisify` property to an array containing all the method names.  Example:

```js
{
	// only promisify some methods
	__promisify: ["sleep"]
}
```

Note that in order for your methods to be promise-compatible, they must accept a callback as the final argument, and that callback must be called using the standard Node.js convention (i.e. `(err)` or `(err, result)`).  The error *must* be the first argument sent to the callback (or false/undefined on success), and a result, if any, must be the second argument.

# License

Copyright (c) 2015 - 2017 Joseph Huckaby

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
