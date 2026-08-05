---
title: "Writing a Tiny Stack VM in C"
date: 2026-07-12
description: "A walkthrough of a minimal bytecode virtual machine, from opcode design to a working REPL."
tags: ["c", "virtual-machines", "systems"]
---

Every systems programmer eventually writes a tiny virtual machine. This one is about 300 lines of C
and supports a handful of opcodes: push, add, sub, mul, and print.

## The instruction set

We keep the opcode table small on purpose.

| Opcode  | Meaning        | Stack effect       |
|---------|----------------|---------------------|
| `PUSH`  | push a literal | `() -> (a)`         |
| `ADD`   | pop two, add   | `(a, b) -> (a+b)`   |
| `PRINT` | pop and print  | `(a) -> ()`         |

{{< note >}}
The stack is a fixed-size array of `int64_t`. No bounds checking yet — that's a good exercise
for the reader.
{{< /note >}}

## The core loop

```c
typedef enum { OP_PUSH, OP_ADD, OP_SUB, OP_MUL, OP_PRINT, OP_HALT } OpCode;

void vm_run(VM *vm) {
    for (;;) {
        uint8_t op = vm->code[vm->ip++];
        switch (op) {
            case OP_PUSH:
                vm_push(vm, vm->code[vm->ip++]);
                break;
            case OP_ADD: {
                int64_t b = vm_pop(vm);
                int64_t a = vm_pop(vm);
                vm_push(vm, a + b);
                break;
            }
            case OP_PRINT:
                printf("%lld\n", vm_pop(vm));
                break;
            case OP_HALT:
                return;
            default:
                fprintf(stderr, "unknown opcode: %d\n", op);
                exit(1);
        }
    }
}
```

{{< warning >}}
`vm->ip` is never bounds-checked against `vm->code_len`. A malformed program will happily read
past the end of the buffer. Fine for a toy, not fine for anything you'd ship.
{{< /warning >}}

## Wiring up a tiny REPL

```bash
$ ./vm examples/add.bc
3
$ echo $?
0
```

## Where this goes next

A few natural extensions:

1. Add jump instructions (`JMP`, `JZ`) for control flow.
2. Add a call stack for function calls.
3. Add a simple assembler so you're not hand-writing bytes.

{{< tip >}}
If you want a gentler on-ramp, start with [Crafting Interpreters](https://craftinginterpreters.com/)'s
bytecode VM chapters — the design decisions there transfer almost directly to C.
{{< /tip >}}

Full source is on my [GitHub](https://github.com/abhyuday-fr).
