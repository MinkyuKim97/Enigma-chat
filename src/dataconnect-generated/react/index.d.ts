import { CreateGroupChatData, CreateGroupChatVariables, GetMyGroupChatsData, JoinGroupChatData, JoinGroupChatVariables, ListGroupMembersData, ListGroupMembersVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateGroupChat(options?: useDataConnectMutationOptions<CreateGroupChatData, FirebaseError, CreateGroupChatVariables>): UseDataConnectMutationResult<CreateGroupChatData, CreateGroupChatVariables>;
export function useCreateGroupChat(dc: DataConnect, options?: useDataConnectMutationOptions<CreateGroupChatData, FirebaseError, CreateGroupChatVariables>): UseDataConnectMutationResult<CreateGroupChatData, CreateGroupChatVariables>;

export function useGetMyGroupChats(options?: useDataConnectQueryOptions<GetMyGroupChatsData>): UseDataConnectQueryResult<GetMyGroupChatsData, undefined>;
export function useGetMyGroupChats(dc: DataConnect, options?: useDataConnectQueryOptions<GetMyGroupChatsData>): UseDataConnectQueryResult<GetMyGroupChatsData, undefined>;

export function useJoinGroupChat(options?: useDataConnectMutationOptions<JoinGroupChatData, FirebaseError, JoinGroupChatVariables>): UseDataConnectMutationResult<JoinGroupChatData, JoinGroupChatVariables>;
export function useJoinGroupChat(dc: DataConnect, options?: useDataConnectMutationOptions<JoinGroupChatData, FirebaseError, JoinGroupChatVariables>): UseDataConnectMutationResult<JoinGroupChatData, JoinGroupChatVariables>;

export function useListGroupMembers(vars: ListGroupMembersVariables, options?: useDataConnectQueryOptions<ListGroupMembersData>): UseDataConnectQueryResult<ListGroupMembersData, ListGroupMembersVariables>;
export function useListGroupMembers(dc: DataConnect, vars: ListGroupMembersVariables, options?: useDataConnectQueryOptions<ListGroupMembersData>): UseDataConnectQueryResult<ListGroupMembersData, ListGroupMembersVariables>;
