import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Contact_Key {
  ownerId: UUIDString;
  contactUserId: UUIDString;
  __typename?: 'Contact_Key';
}

export interface Conversation_Key {
  user1Id: UUIDString;
  user2Id: UUIDString;
  __typename?: 'Conversation_Key';
}

export interface CreateGroupChatData {
  groupChat_insert: GroupChat_Key;
}

export interface CreateGroupChatVariables {
  name: string;
  description: string;
  avatarUrl?: string | null;
}

export interface GetMyGroupChatsData {
  groupChats: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    avatarUrl?: string | null;
    createdAt: TimestampString;
  } & GroupChat_Key)[];
}

export interface GroupChat_Key {
  id: UUIDString;
  __typename?: 'GroupChat_Key';
}

export interface GroupMembership_Key {
  groupChatId: UUIDString;
  userId: UUIDString;
  __typename?: 'GroupMembership_Key';
}

export interface JoinGroupChatData {
  groupMembership_insert: GroupMembership_Key;
}

export interface JoinGroupChatVariables {
  groupChatId: UUIDString;
}

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

export interface ListGroupMembersVariables {
  groupChatId: UUIDString;
}

export interface Message_Key {
  id: UUIDString;
  __typename?: 'Message_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateGroupChatRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateGroupChatVariables): MutationRef<CreateGroupChatData, CreateGroupChatVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateGroupChatVariables): MutationRef<CreateGroupChatData, CreateGroupChatVariables>;
  operationName: string;
}
export const createGroupChatRef: CreateGroupChatRef;

export function createGroupChat(vars: CreateGroupChatVariables): MutationPromise<CreateGroupChatData, CreateGroupChatVariables>;
export function createGroupChat(dc: DataConnect, vars: CreateGroupChatVariables): MutationPromise<CreateGroupChatData, CreateGroupChatVariables>;

interface GetMyGroupChatsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyGroupChatsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMyGroupChatsData, undefined>;
  operationName: string;
}
export const getMyGroupChatsRef: GetMyGroupChatsRef;

export function getMyGroupChats(): QueryPromise<GetMyGroupChatsData, undefined>;
export function getMyGroupChats(dc: DataConnect): QueryPromise<GetMyGroupChatsData, undefined>;

interface JoinGroupChatRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: JoinGroupChatVariables): MutationRef<JoinGroupChatData, JoinGroupChatVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: JoinGroupChatVariables): MutationRef<JoinGroupChatData, JoinGroupChatVariables>;
  operationName: string;
}
export const joinGroupChatRef: JoinGroupChatRef;

export function joinGroupChat(vars: JoinGroupChatVariables): MutationPromise<JoinGroupChatData, JoinGroupChatVariables>;
export function joinGroupChat(dc: DataConnect, vars: JoinGroupChatVariables): MutationPromise<JoinGroupChatData, JoinGroupChatVariables>;

interface ListGroupMembersRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListGroupMembersVariables): QueryRef<ListGroupMembersData, ListGroupMembersVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListGroupMembersVariables): QueryRef<ListGroupMembersData, ListGroupMembersVariables>;
  operationName: string;
}
export const listGroupMembersRef: ListGroupMembersRef;

export function listGroupMembers(vars: ListGroupMembersVariables): QueryPromise<ListGroupMembersData, ListGroupMembersVariables>;
export function listGroupMembers(dc: DataConnect, vars: ListGroupMembersVariables): QueryPromise<ListGroupMembersData, ListGroupMembersVariables>;

