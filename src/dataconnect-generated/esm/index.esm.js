import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'corelabassign42',
  location: 'us-east4'
};

export const createGroupChatRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateGroupChat', inputVars);
}
createGroupChatRef.operationName = 'CreateGroupChat';

export function createGroupChat(dcOrVars, vars) {
  return executeMutation(createGroupChatRef(dcOrVars, vars));
}

export const getMyGroupChatsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyGroupChats');
}
getMyGroupChatsRef.operationName = 'GetMyGroupChats';

export function getMyGroupChats(dc) {
  return executeQuery(getMyGroupChatsRef(dc));
}

export const joinGroupChatRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'JoinGroupChat', inputVars);
}
joinGroupChatRef.operationName = 'JoinGroupChat';

export function joinGroupChat(dcOrVars, vars) {
  return executeMutation(joinGroupChatRef(dcOrVars, vars));
}

export const listGroupMembersRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListGroupMembers', inputVars);
}
listGroupMembersRef.operationName = 'ListGroupMembers';

export function listGroupMembers(dcOrVars, vars) {
  return executeQuery(listGroupMembersRef(dcOrVars, vars));
}

