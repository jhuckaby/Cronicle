# Overview

The JavaScript language already supports object orientated programming, but the syntax is strange and inheritance is wonky.  This library is provided as a means to create classes in a more classical sort of way, including support for static class members, proper constructors, inheritance, and namespaces.

# Usage

This section describes how to use the framework.

## The oop.js File

The framework is provided as a JavaScript library file that you must include in your web page:

```html
	<script type="text/javascript" src="oop.js"></script>
```

That's it!  The library is now available to your page.  Make sure you include the library near the top of your file, above all your other code.

## Creating Classes

Here is how you create a class using the framework.  You'll notice this is dramatically different than the traditional JavaScript class syntax.

```javascript
	Class.create( 'Animal', {
		
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
		
	} );
```

This defines a class called `Animal`, with two member variables, `nickname` and `color`, a constructor and a `getInfo()` method which returns the nickname and color.  You'll notice that to define the constructor method you use the keyword `__construct` which is exactly the same in PHP.  Usage of this class is probably what you would expect:

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
	Class.subclass( Animal, 'Bear', {
		
		// define a new member variable
		wants: 'Honey',
		
		// and a new method
		roar: function() {
			console.log("Roar!  Give me " + this.wants + "!");
		}
		
	} );
```

This defines a `Bear` class which inherits from the base `Animal` class, including the constructor.  Notice that we passed the parent class as a reference, not a string.  What we did is extend the base class by introducing a new member variable `wants`, and a new method `roar()`.  Everything else from the base class will be present in subclass instances:

```javascript
	var grizzly = new Bear('Fred', 'Brown');
	console.log( grizzly.getInfo() );
	
	grizzly.wants = 'blood';
	grizzly.roar();
```

## Inheritance

The framework provides an easy way to override methods defined in a base class.  Simply redeclare them in the subclass:

```javascript
	Class.add( Bear, {
		
		// override base class method
		getInfo: function() {
			return "Bear has overridden this!";
		}
		
	} );
```

This also demonstrates `Class.add()` which allows you to add/replace methods or member variables in a class after it is defined.  Note that the class name is passed in as a reference, not a string.  Alternatively you could just have defined the method to be overridden in the original subclass definition.

### Calling Superclass methods

You can also explicitly invoke the superclass method, in order to extend its functionality:

```javascript
	Class.add( Bear, {
		
		// override base class method
		getInfo: function() {
			// first, get info from base class
			var info = this.__parent.getInfo.call(this);
			
			// append bear info and return combined info
			info += "\nWants: " + this.wants;
			return info;
		}
		
	} );
```

So here we are overriding the base class `getInfo()` method, but the first thing we do is call the superclass method of the same name.  This is done with the `__parent` keyword, which points to the parent class prototype object.  The JavaScript `call()` method allows you to call a function in object context (hence we are passing in the `this` keyword to it).

Invoking a superclass constructor is just as easy:

```javascript
	Class.subclass( Animal, 'Bear', {
		
		// define a new member variable
		wants: 'Honey',
		
		// override base class constructor
		__construct: function(new_name, new_color, new_wants) {
			// invoke superclass constructor to set name and color
			this.__parent.__construct.call(this, new_name, new_color);
			this.wants = new_wants;
		}
		
		// and a new method
		roar: function() {
			console.log("Roar!  Give me " + this.wants + "!");
		}
		
	} );
```

**Note:** You cannot use `Class.add()` to redeclare a class constructor.

## Static Class Members

You can define static class members (variables or methods) by using the `__static` keyword.  These members do not become part of class instances, but instead live inside the class reference object, and must be accessed that way too.  Example class definition:

```javascript
	Class.create( 'Beer', {
		
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
			
			if (!Beer.types[new_type]) throw new Error("TYPE NOT KNOWN: " + new_type);
			this.type = new_type;
		},
		
		// methods
		getInfo: function() {
			return("Nickname: " + this.nickname + "\nType: " + this.type);
		}
		
	} );
```

Here we define a `Beer` class which has a static member defined in the `__static` element.  Anything placed there will *not* be propagated to class instances, and must be accessed using the class reference instead.  As you can see in the constructor, we are checking the new type against the `types` array which is declared static, so we are getting to the list by using the syntax: `Beer.types` rather than `this.types`.

If you were to change `Beer.types` later on, then *all* classes would see the changes instantly.  The content is effectively shared.

## Namespaces

The OOP framework also offers "namespaces".  That is, named containers for your classes to live in, to prevent name collision with built-in classes or 3rd party libraries.  You declare namespaces simply by adding periods (.) to your class name as passed to `Class.create()` and `Class.subclass()`:

```javascript
	Class.create( 'Beverage.Beer', {
		
	} );
```

You can nest namespaces any number of levels deep.  The library will automatically create any parent namespaces as needed.  Now you can create instances of the class using `Beverage.Beer` instead of just `Beer`:

```javascript
	var mybeer = new Beverage.Beer();
```

You can explicity create namespaces (without creating classes) using the `Namespace.create()` function.  Example:

```javascript
	Namespace.create( 'Beverage' );
```

All this does is create empty objects, ready to receive classes (although creating classes automatically creates the parent namespaces, so this is typically not required).

**Note**: Do not use a class name as a namespace, or visa-versa.  For example, if you create a class named `Beverage`, do not also use it as a namespace for a subclass, like `Beverage.Beer`.  The results are undefined.

## Require Classes

If your class requires other classes (possibly those defined in other include files), you can use the `Class.require()` function to make sure they are available.  This is sort of like a class "assert" (see below), which will throw an alert if the required classes are not defined.  Example:

```javascript
	Class.require( 'Animal' );
```

This would throw an alert if the `Animal` class was not defined.  You can also specify multiple classes on the same call:

```javascript
	Class.require( 'Animal', 'Bear' );
```

## Assert Macro

The framework comes with a very simple `assert()` macro for testing that things you know should be true, are in fact true.  You can pass it an optional message to be alerted if the assert fails, so you can tell them apart.  Example:

```javascript
	assert( 1 + 1 == 2, "Math doesn't work" );
```

If the fact turns out to be false, then the text is displayed in an alert so you can immediately see it and respond.  This is a good way to check for objects that should exist in a parent container, by using the double-bang operator:

```javascript
	assert( !!window.something, "window.something does not exist");
```

Using the double-bang operator simply converts anything to a Boolean -- a simple way to check for existence of an object.

# License

The MIT License

Copyright (c) 2004 - 2015 Joseph Huckaby

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
