# Enigma Chat
[ Encrypt your messages with 1.74M cases of encrypting combinations]

## How to use?
1. Click a link on upper-right side of reposipory to enter Enigma Chat.
2. Set your username. You can change it later, but note that doing so will change the decryption ID.
3. Enter or open a chatroom. Each chatroom's max user is 2.
4. To send messages, exactly 2 users(anyone) must be in the chat. Messages decrypt correctly only when both original users are in teh chatroom at the same time.
5. Send the message! Enigma Chat will automatically encrypt your messages and upload it on the database. Even the database owner can't read the original messages.
6. Enjoy your fully-encrypted chat experience! 

## How are messages encrypted?
Enigma Chat is based on the WW 2 Enigma machine’s encryption logic.
It digitizes a rotor-based system where the cipher changes with every character, making decryption impossible without the correct initial settings.

In Enigma Chat, the encryption key is generated from the combined client IDs of 2 users who enter the chatroom at first.
Only encrypted messages are stored in the database, so even the database owner can't read the original content.

Messages are decrypted using the current 2 users' combined client IDs.
If either of the original 2 users leaves or is replaced, the key changes immediatel. Decryption still runs, but the output becomes unreadable string combination.