+++
date = '2026-08-09T21:53:36+05:30'
draft = false
comments = true
title = 'Type Punning'
description = "Type punning is a programming trick where you force the computer to read a chunk of memory as a completely different data type than what it was originally declared as."
tags = ['cpp', 'coding', 'programming', 'low-latency']
categories = ['Low-Latency']
+++

## What is Type Punning?
Type punning is a low-level programming technique in C and C++ that subverts the type system to reinterpret the bit representation of an object of one type as a different, incompatible type.
This allows developers to access the underlying binary data directly, bypassing standard type-safe conversions, which is commonly used for performance optimization, serialization, deserialization, and hardware interaction.

## Look at this simple example
I'll just explain with the example directly, look at this example
```cpp
  #include <iostream>
  int main(){
    int a;
    double value = (double) a;
    std::cout << value << "\n";
  }
```

and when you run it, it may print 25 again.
What if we use the address of a, type cast that into double and then derefernce it?
this will look like this:
```cpp
  double value = *(double*)&a;
```

Hmm... but it will not print 25... you can try it for yourself...
But why?
* **The Binary Format Is *Completely Different***: A 32 bit integer stored 25 as straight binary, i.e 11001 with zeroes before to complete 32 bits. But a floating-point (or double) number uses a complex scientific notation format ([IEEE 754](https://ieeexplore.ieee.org/document/8766229)).

* **Size Mismatch**: int takes up 4 bytes of memory whereas a double takes up 8 of it. So when we tell the computer to read a 8 bytes of a which only has 4 bytes, it reads some random garbage data sitting right next to it.

That's why it is very dangerous and writing into memory like this is even more dangerous and that's why In C and C++, type punning is tightly regulated by **strict aliasing rules** to prevent unpredictable behavior and enable compiler optimizations.

Hmmm, so to read it and access properly in our example we might need to something like:
```cpp
  int value = *(int *)(double*)&a;
```

But why doing all that? That's just so useless. And that's right.. or is it? *vsauce music plays*.

## A better example and usage of type punning
Now this is where it becomes interesting and usable.

Let's take a look at this struct:
```cpp
  struct Entity{
    int x;
    int y;
  };
```

and we instantiate it like this in the `main` function
```cpp
  int main(){
    Entity e = {4, 8};
  }
```

and to access its elements we will have to do this:
```cpp
  int x = e.x;
  int y = e.y;
  std::cout << x << ", " << y << "\n";
```

and no doubt it will give the output `4, 8`. We all get that.. now look at this:

```cpp
#include <iostream>

struct Entity{
  int x;
  int y;
};

int main(){
  Entity e = {4, 8};
  int *position = (int*)&e;
  std::cout << position[0] << ", " << position[1] << "\n";
}
```

This also prints `4, 8`. we just made an array out of the `Entity`. and `position` is just the pointer poiniting to the struct (its first element), so we can access the elements of it like just any array. Also notice how all the elements of the struct are `int`(same type).

Wanna see something cooler?

```cpp
  /* ... iostream header and Entity struct */
  int main(){
    int y = *(int *)((char *)&e + 4);
    std::cout << y << "\n";
  }
```

This prints `8` as we access the second element of the `Entity` by *punning* it into a char pointer (1 byte), but an integer is 4 bytes, so we add 4 in it as the position of the second element will be 4 bytes after the first element. Then we cast the whole into the integer pointer and deference it.

That's it.

## Real life examples

But where is it used? Has anyone or an organisation used it practically in thier systems?
Yes, here are some of them .

* **Fast Inverse Square Root**: The most famous example is the **Quake III algorithm**, which reinterprets the bit pattern of a float as an int to perform integer arithmetic for an inverse square root. You can see about that in details [here](https://attackofthefanboy.com/articles/the-quake-iii-algorithm-that-defies-math-explained/).

* **Fast FP Comparison**: Comparing floating-point numbers by reinterpreting them as signed integers (with sign bit adjustment) allows for **branchless** comparison logic, which is faster than standard IEEE 754 comparison operations in tight loops. 

* **Bitwise Serialization**: In embedded systems and networking, type punning via std::memcpy or std::bit_cast allows direct copying of binary data structures (like network packets or hardware registers) into memory buffers without runtime conversion, minimizing CPU cycles.

* **Nextafter Implementation**: Finding neighboring floating-point values can be accelerated by incrementing the integer representation of the float directly, leveraging the linear relationship between integer and float bit patterns for IEEE 754 numbers.

## Note 
Modern C++ (C++20) recommends [std::bit_cast](https://en.cppreference.com/cpp/numeric/bit_cast) or [std::memcpy](https://en.cppreference.com/cpp/string/byte/memcpy) for these tasks to ensure strict aliasing rules are respected while allowing compilers to optimize the resulting code into efficient register-to-register moves.

## Your Views

Please lemme know if you learnt something new in this blog. Also, if you have seen any other example or *used* type punning in any of your projects to optimize the computation time then also do share with the rest of us :)

Thank you very much for reading :>
