+++
date = '2026-08-17T10:49:05+05:30'
draft = false
comments = true
title = 'Intrusive Data'
description = "There are many ways to make data generic in C and C++. There is one peculiar way that I like the most and is also used in Linux Kernel."
tags = ['cpp', 'coding', 'programming', 'low-latency']
categories = ['Low-Latency']
+++

## What is an Intrusive Data Type?
Embedding “dataless” structures into the data type is called intrusive data structures, because you need to modify your data type to use it.
Now that the data structure is free of data, to get the data back, just offset the address of the struct.

A normal linked list of the data would look like this
```
         ┌──┐       ┌──┐
         │  ▼       │  ▼
┌Node──┐ │ ┌Node──┐ │ ┌Node──┐
│┌────┐│ │ │┌────┐│ │ │┌────┐│
││next├┼─┘ ││next├┼─┘ ││next├┼──▶ …
│├────┤│   │├────┤│   │├────┤│
││ptr ││   ││ptr ││   ││ptr ││
│└─┬──┘│   │└─┬──┘│   │└─┬──┘│
└──┼───┘   └──┼───┘   └──┼───┘
   ▼          ▼          ▼
 ┌────┐     ┌────┐     ┌────┐
 │data│     │data│     │data│
 └────┘     └────┘     └────┘
```

but an intrusive linked list of all the data would look like

```
┌Data──┐   ┌Data──┐   ┌Data──┐
│ …    │   │ …    │   │ …    │
│┌────┐│   │┌────┐│   │┌────┐│
││node├┼──▶││node├┼──▶││node├┼──▶ …
│└────┘│   │└────┘│   │└────┘│
│ …    │   │ …    │   │ …    │
└──────┘   └──────┘   └──────┘
```

This may explain what's happening by itself. If not, then it's just instead of adding data in the node itself we add Node in the data, if that makes sense.
But to access the data, we need to implement some offset trick, just like in the linux's kernel.

## `container_of` and the offset trick
* We know that struct is a blueprint. When you create an object, the compiler reserves a continuous block of memory.
for eg.
```
  struct Entry{
    std::string key; // let's say this is 32 bytes
    std::string value; // 32 bytes too
    HNode node; // takes up 16 bytes
  };
```
so total 80 bytes.

* Compiler knows how far each piece is from the starting of the struct.
So, key: 0 bytes, value: 32 bytes, node: 64 bytes
The distance is called offset and the C++ macro offsetof(Entry, node) simply finds that offset of node.

* HashMap gives back a pointer to an HNode. So for an Entry at address 1000, we will get handed a pointer to 1064 (remember the offset of node).

* We just need to move backward from there now, i.e, 1064 - 64 = 1000 and that's litteraly what happening there!
  - `(T*)` is just type conversion.
  - `(char *)(ptr)` is just converting the node pointer to char pointer to count our math in exact 1-byte increments.
  - `offsetof(T, member)` is just that maths we did above.
all of this is then used together in `((T*)((char*)(ptr) - offsetof(T, member)))`
and we define it all in a `container_of` using `#define` macro.

## Why should we use it?
This post is a part of Low-Latency Blog category so there must be some advantages of using it over the tradtional ways.. and fortunately, yes there are.
1. We should avoid the Linked lists as we do currently because of [**cache locality**](https://en.wikipedia.org/wiki/Locality_of_reference).
2. Data and and the nodes are "separated" making our data generic, they don't have any dependency.

## Real life examples
- One of the biggest example where these tricks are used in [Linux Kernel](https://github.com/torvalds/linux/blob/master/include/linux/container_of.h).
- I've also used in the Redis like in-memory key-value storage [here](https://github.com/abhyuday-fr/Redis).

## Try it yourself.
I made an [Intrusive-HashMap](https://github.com/abhyuday-fr/Low-Level-CPP/tree/main/Intrusive-Hash-Map) where I used the intrusive data type there. You can view that for reference and make something of your own where you use this, wether it be a simple Linked-List program or anything. Btw I didn't add the dynamic rehashing in that yet, I am planning to do so but not getting enough time to touch that right now. If you like, you can contribute in that too :)
No worries I've implemented that in the hashmap I used in my Redis project too so you can take reference from that.
