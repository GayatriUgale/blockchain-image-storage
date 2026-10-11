// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Upload {
    struct Access {
        address user;
        bool access;
        uint256 expiry;
    }

    mapping(address => string[]) value;
    mapping(address => mapping(address => bool)) ownership;
    mapping(address => Access[]) AccessList;
    mapping(address => mapping(address => bool)) previousData;
    mapping(address => mapping(address => uint256)) accessExpiry;

    event FileAdded(address indexed owner, string url);
    event AccessGranted(address indexed owner, address indexed user, uint256 expiry);
    event AccessRevoked(address indexed owner, address indexed user);

    function add(address _user, string memory url) external {
        require(_user == msg.sender, "Only owner can add");
        value[_user].push(url);
        emit FileAdded(_user, url);
    }

    function allow(address user, uint256 duration) external {
        require(duration > 0, "Duration must be positive");

        ownership[msg.sender][user] = true;
        accessExpiry[msg.sender][user] = block.timestamp + duration;

        if (previousData[msg.sender][user]) {
            for (uint i = 0; i < AccessList[msg.sender].length; i++) {
                if (AccessList[msg.sender][i].user == user) {
                    AccessList[msg.sender][i].access = true;
                    AccessList[msg.sender][i].expiry =
                        accessExpiry[msg.sender][user];
                }
            }
        } else {
            AccessList[msg.sender].push(
                Access(user, true, accessExpiry[msg.sender][user])
            );
            previousData[msg.sender][user] = true;
        }

        emit AccessGranted(msg.sender, user, accessExpiry[msg.sender][user]);
    }

    function revoke(address user) public {
        ownership[msg.sender][user] = false;
        accessExpiry[msg.sender][user] = 0;

        for (uint i = 0; i < AccessList[msg.sender].length; i++) {
            if (AccessList[msg.sender][i].user == user) {
                AccessList[msg.sender][i].access = false;
            }
        }

        emit AccessRevoked(msg.sender, user);
    }

    function display(address _user)
        external
        view
        returns (string[] memory)
    {
        require(
            _user == msg.sender ||
                (
                    ownership[_user][msg.sender] &&
                    accessExpiry[_user][msg.sender] > block.timestamp
                ),
            "You are not allowed to view"
        );

        return value[_user];
    }

    function sharelist(address _user)
        external
        view
        returns (Access[] memory)
    {
        return AccessList[_user];
    }
}