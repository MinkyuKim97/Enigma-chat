const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'corelabassign42',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const createGroupChatRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateGroupChat', inputVars);
}
createGroupChatRef.operationName = 'CreateGroupChat';
exports.createGroupChatRef = createGroupChatRef;

exports.createGroupChat = function createGroupChat(dcOrVars, vars) {
  return executeMutation(createGroupChatRef(dcOrVars, vars));
};

const getMyGroupChatsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyGroupChats');
}
getMyGroupChatsRef.operationName = 'GetMyGroupChats';
exports.getMyGroupChatsRef = getMyGroupChatsRef;

exports.getMyGroupChats = function getMyGroupChats(dc) {
  return executeQuery(getMyGroupChatsRef(dc));
};

const joinGroupChatRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'JoinGroupChat', inputVars);
}
joinGroupChatRef.operationName = 'JoinGroupChat';
exports.joinGroupChatRef = joinGroupChatRef;

exports.joinGroupChat = function joinGroupChat(dcOrVars, vars) {
  return executeMutation(joinGroupChatRef(dcOrVars, vars));
};

const listGroupMembersRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListGroupMembers', inputVars);
}
listGroupMembersRef.operationName = 'ListGroupMembers';
exports.listGroupMembersRef = listGroupMembersRef;

exports.listGroupMembers = function listGroupMembers(dcOrVars, vars) {
  return executeQuery(listGroupMembersRef(dcOrVars, vars));
};
