# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetMyGroupChats*](#getmygroupchats)
  - [*ListGroupMembers*](#listgroupmembers)
- [**Mutations**](#mutations)
  - [*CreateGroupChat*](#creategroupchat)
  - [*JoinGroupChat*](#joingroupchat)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetMyGroupChats
You can execute the `GetMyGroupChats` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMyGroupChats(): QueryPromise<GetMyGroupChatsData, undefined>;

interface GetMyGroupChatsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyGroupChatsData, undefined>;
}
export const getMyGroupChatsRef: GetMyGroupChatsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMyGroupChats(dc: DataConnect): QueryPromise<GetMyGroupChatsData, undefined>;

interface GetMyGroupChatsRef {
  ...
  (dc: DataConnect): QueryRef<GetMyGroupChatsData, undefined>;
}
export const getMyGroupChatsRef: GetMyGroupChatsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMyGroupChatsRef:
```typescript
const name = getMyGroupChatsRef.operationName;
console.log(name);
```

### Variables
The `GetMyGroupChats` query has no variables.
### Return Type
Recall that executing the `GetMyGroupChats` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMyGroupChatsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetMyGroupChatsData {
  groupChats: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    avatarUrl?: string | null;
    createdAt: TimestampString;
  } & GroupChat_Key)[];
}
```
### Using `GetMyGroupChats`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMyGroupChats } from '@dataconnect/generated';


// Call the `getMyGroupChats()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMyGroupChats();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMyGroupChats(dataConnect);

console.log(data.groupChats);

// Or, you can use the `Promise` API.
getMyGroupChats().then((response) => {
  const data = response.data;
  console.log(data.groupChats);
});
```

### Using `GetMyGroupChats`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMyGroupChatsRef } from '@dataconnect/generated';


// Call the `getMyGroupChatsRef()` function to get a reference to the query.
const ref = getMyGroupChatsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMyGroupChatsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.groupChats);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.groupChats);
});
```

## ListGroupMembers
You can execute the `ListGroupMembers` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listGroupMembers(vars: ListGroupMembersVariables): QueryPromise<ListGroupMembersData, ListGroupMembersVariables>;

interface ListGroupMembersRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListGroupMembersVariables): QueryRef<ListGroupMembersData, ListGroupMembersVariables>;
}
export const listGroupMembersRef: ListGroupMembersRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listGroupMembers(dc: DataConnect, vars: ListGroupMembersVariables): QueryPromise<ListGroupMembersData, ListGroupMembersVariables>;

interface ListGroupMembersRef {
  ...
  (dc: DataConnect, vars: ListGroupMembersVariables): QueryRef<ListGroupMembersData, ListGroupMembersVariables>;
}
export const listGroupMembersRef: ListGroupMembersRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listGroupMembersRef:
```typescript
const name = listGroupMembersRef.operationName;
console.log(name);
```

### Variables
The `ListGroupMembers` query requires an argument of type `ListGroupMembersVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListGroupMembersVariables {
  groupChatId: UUIDString;
}
```
### Return Type
Recall that executing the `ListGroupMembers` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListGroupMembersData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListGroupMembersData {
  groupChat?: {
    users_via_GroupMembership: ({
      id: UUIDString;
      username: string;
      displayName?: string | null;
      avatarUrl?: string | null;
    } & User_Key)[];
  };
}
```
### Using `ListGroupMembers`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listGroupMembers, ListGroupMembersVariables } from '@dataconnect/generated';

// The `ListGroupMembers` query requires an argument of type `ListGroupMembersVariables`:
const listGroupMembersVars: ListGroupMembersVariables = {
  groupChatId: ..., 
};

// Call the `listGroupMembers()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listGroupMembers(listGroupMembersVars);
// Variables can be defined inline as well.
const { data } = await listGroupMembers({ groupChatId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listGroupMembers(dataConnect, listGroupMembersVars);

console.log(data.groupChat);

// Or, you can use the `Promise` API.
listGroupMembers(listGroupMembersVars).then((response) => {
  const data = response.data;
  console.log(data.groupChat);
});
```

### Using `ListGroupMembers`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listGroupMembersRef, ListGroupMembersVariables } from '@dataconnect/generated';

// The `ListGroupMembers` query requires an argument of type `ListGroupMembersVariables`:
const listGroupMembersVars: ListGroupMembersVariables = {
  groupChatId: ..., 
};

// Call the `listGroupMembersRef()` function to get a reference to the query.
const ref = listGroupMembersRef(listGroupMembersVars);
// Variables can be defined inline as well.
const ref = listGroupMembersRef({ groupChatId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listGroupMembersRef(dataConnect, listGroupMembersVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.groupChat);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.groupChat);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateGroupChat
You can execute the `CreateGroupChat` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createGroupChat(vars: CreateGroupChatVariables): MutationPromise<CreateGroupChatData, CreateGroupChatVariables>;

interface CreateGroupChatRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateGroupChatVariables): MutationRef<CreateGroupChatData, CreateGroupChatVariables>;
}
export const createGroupChatRef: CreateGroupChatRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createGroupChat(dc: DataConnect, vars: CreateGroupChatVariables): MutationPromise<CreateGroupChatData, CreateGroupChatVariables>;

interface CreateGroupChatRef {
  ...
  (dc: DataConnect, vars: CreateGroupChatVariables): MutationRef<CreateGroupChatData, CreateGroupChatVariables>;
}
export const createGroupChatRef: CreateGroupChatRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createGroupChatRef:
```typescript
const name = createGroupChatRef.operationName;
console.log(name);
```

### Variables
The `CreateGroupChat` mutation requires an argument of type `CreateGroupChatVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateGroupChatVariables {
  name: string;
  description: string;
  avatarUrl?: string | null;
}
```
### Return Type
Recall that executing the `CreateGroupChat` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateGroupChatData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateGroupChatData {
  groupChat_insert: GroupChat_Key;
}
```
### Using `CreateGroupChat`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createGroupChat, CreateGroupChatVariables } from '@dataconnect/generated';

// The `CreateGroupChat` mutation requires an argument of type `CreateGroupChatVariables`:
const createGroupChatVars: CreateGroupChatVariables = {
  name: ..., 
  description: ..., 
  avatarUrl: ..., // optional
};

// Call the `createGroupChat()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createGroupChat(createGroupChatVars);
// Variables can be defined inline as well.
const { data } = await createGroupChat({ name: ..., description: ..., avatarUrl: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createGroupChat(dataConnect, createGroupChatVars);

console.log(data.groupChat_insert);

// Or, you can use the `Promise` API.
createGroupChat(createGroupChatVars).then((response) => {
  const data = response.data;
  console.log(data.groupChat_insert);
});
```

### Using `CreateGroupChat`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createGroupChatRef, CreateGroupChatVariables } from '@dataconnect/generated';

// The `CreateGroupChat` mutation requires an argument of type `CreateGroupChatVariables`:
const createGroupChatVars: CreateGroupChatVariables = {
  name: ..., 
  description: ..., 
  avatarUrl: ..., // optional
};

// Call the `createGroupChatRef()` function to get a reference to the mutation.
const ref = createGroupChatRef(createGroupChatVars);
// Variables can be defined inline as well.
const ref = createGroupChatRef({ name: ..., description: ..., avatarUrl: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createGroupChatRef(dataConnect, createGroupChatVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.groupChat_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.groupChat_insert);
});
```

## JoinGroupChat
You can execute the `JoinGroupChat` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
joinGroupChat(vars: JoinGroupChatVariables): MutationPromise<JoinGroupChatData, JoinGroupChatVariables>;

interface JoinGroupChatRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: JoinGroupChatVariables): MutationRef<JoinGroupChatData, JoinGroupChatVariables>;
}
export const joinGroupChatRef: JoinGroupChatRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
joinGroupChat(dc: DataConnect, vars: JoinGroupChatVariables): MutationPromise<JoinGroupChatData, JoinGroupChatVariables>;

interface JoinGroupChatRef {
  ...
  (dc: DataConnect, vars: JoinGroupChatVariables): MutationRef<JoinGroupChatData, JoinGroupChatVariables>;
}
export const joinGroupChatRef: JoinGroupChatRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the joinGroupChatRef:
```typescript
const name = joinGroupChatRef.operationName;
console.log(name);
```

### Variables
The `JoinGroupChat` mutation requires an argument of type `JoinGroupChatVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface JoinGroupChatVariables {
  groupChatId: UUIDString;
}
```
### Return Type
Recall that executing the `JoinGroupChat` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `JoinGroupChatData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface JoinGroupChatData {
  groupMembership_insert: GroupMembership_Key;
}
```
### Using `JoinGroupChat`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, joinGroupChat, JoinGroupChatVariables } from '@dataconnect/generated';

// The `JoinGroupChat` mutation requires an argument of type `JoinGroupChatVariables`:
const joinGroupChatVars: JoinGroupChatVariables = {
  groupChatId: ..., 
};

// Call the `joinGroupChat()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await joinGroupChat(joinGroupChatVars);
// Variables can be defined inline as well.
const { data } = await joinGroupChat({ groupChatId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await joinGroupChat(dataConnect, joinGroupChatVars);

console.log(data.groupMembership_insert);

// Or, you can use the `Promise` API.
joinGroupChat(joinGroupChatVars).then((response) => {
  const data = response.data;
  console.log(data.groupMembership_insert);
});
```

### Using `JoinGroupChat`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, joinGroupChatRef, JoinGroupChatVariables } from '@dataconnect/generated';

// The `JoinGroupChat` mutation requires an argument of type `JoinGroupChatVariables`:
const joinGroupChatVars: JoinGroupChatVariables = {
  groupChatId: ..., 
};

// Call the `joinGroupChatRef()` function to get a reference to the mutation.
const ref = joinGroupChatRef(joinGroupChatVars);
// Variables can be defined inline as well.
const ref = joinGroupChatRef({ groupChatId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = joinGroupChatRef(dataConnect, joinGroupChatVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.groupMembership_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.groupMembership_insert);
});
```

