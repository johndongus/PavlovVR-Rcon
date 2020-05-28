const inquirer = require('inquirer');
const net = require('net')
const fs = require('fs');
var servers = require('./servers.json');

serverPrompt()

function serverPrompt() {
    inquirer.prompt([{
        type: 'list',
        name: 'serverIp',
        message: 'Select a server',
        choices: servers.map(server => server.ip + ':' + server.port),
    }, ]).then(selected => {
        console.info('Connecting to Server:', selected.serverIp);
        (async() => {

            if (servers.filter(serv => serv.ip === selected.serverIp.split(':')[0] && serv.port === selected.serverIp.split(':')[1])[0]) {

                activeServer = servers.filter(serv => serv.ip === selected.serverIp.split(':')[0] && serv.port === selected.serverIp.split(':')[1])[0];
                activeSocket = await spinServer(activeServer)
                if (!activeSocket) {
                    console.log('Couldn\'t connect')
                }
                if (activeSocket) commandPrompt(activeSocket);
            }


        })();

    });



}

function commandHandler(socket, command, params) {
    return new Promise(resolve => {
        findCommand = commands.filter(cmd => cmd.name === command.split(' ')[0])[0]
        if (findCommand) {

            socket.write(command)
            socket.once('data', function(data) {
                return resolve(data.toString())

            });
        }
    });
}

function commandPrompt(socket) {

    inquirer.prompt([{
        type: 'list',
        name: 'command',
        message: 'Commands:',
        choices: commands.map(cmd => cmd.name),
    }, ]).then(selected => {
        (async() => {
            //this is pretty bad, will change to command file for custom commands
            options = {}
            if (selected.command === 'RotateMap') {
                await commandHandler(socket, 'RotateMap')
                commandPrompt(socket)
            }
            if (selected.command === 'ResetSND') {
                await commandHandler(socket, 'ResetSND')
                commandPrompt(socket)
            }
            if (selected.command === 'SwitchMap') {
                map = await anyPrompt('map', true)
                mod = await anyPrompt('mod', true)
                cmd = 'SwitchMap ' + map + ' ' + mod
                console.log(cmd)
                commandHandler(socket, cmd)
                commandPrompt(socket)
            }
            if (selected.command === 'Kick') {
				console.log(await commandHandler(socket, 'RefreshList'))
				console.log('pick the steamID of the player you want to kick from the list above')
				steam64Id = await anyPrompt('steamId64', true)
				commandHandler(socket, 'Kick ' + steam64Id.toString())
                commandPrompt(socket)
            }
            if (selected.command === 'InspectPlayer') {
				console.log(await commandHandler(socket, 'RefreshList'))
				console.log('pick the steamID of the player you want to inspect from the list above')
				steam64Id = await anyPrompt('steamId64', true)
				console.log(await commandHandler(socket, 'InspectPlayer ' + steam64Id.toString()))
                commandPrompt(socket)
            }
            if (selected.command === 'SwitchTeam') {
				console.log(await commandHandler(socket, 'RefreshList'))
				console.log('pick the steamID of the player you want switch teams from the list above')
				steam64Id = await anyPrompt('steamId64', true)
				team = await teamPrompt()
				commandHandler(socket, 'SwitchTeam ' + steam64Id.toString() + ' ' + team)
                commandPrompt(socket)
            }
            if (selected.command === 'Ban') {
				console.log(await commandHandler(socket, 'RefreshList'))
				console.log('pick the steamID of the player you want ban from the list above')
                steam64Id = await anyPrompt('steamId64', true)
                if (steam64Id) {
                    commandHandler(socket, 'Ban ' + steam64Id.toString())
                } else {
                    console.log('Not a Int / Steam 64 ID!')
                }
                commandPrompt(socket)
            }
            if (selected.command === 'Unban') {
				console.log(await commandHandler(socket, 'RefreshList'))
				console.log('pick the steamID of the player you want unban from the list above')
                steam64Id = await anyPrompt('steamId64', true)
                if (steam64Id) {
                    commandHandler(socket, 'UnBan ' + steam64Id.toString())
                } else {
                    console.log('Not a Int / Steam 64 ID!')
                }
				commandPrompt(socket)
            }


            if (selected.command === 'GiveTeamCash') {
                team = await teamPrompt()
				console.log('enter the amount of money')
                cashAmt = await anyPrompt('int', true)
                if (cashAmt) {
                    commandHandler(socket, 'GiveTeamCash ' + team + ' ' + cashAmt)
                } else {
                    console.log('Not a Int / Steam 64 ID!')
                }
				commandPrompt(socket)
            }
            if (selected.command === 'GiveItem') {
				console.log(await commandHandler(socket, 'RefreshList'))
				console.log('pick the steamID of the player you want to give an item from the list above')
                steam64Id = await anyPrompt('steamId64', true)
				console.log('enter the itemID you want to give to a player')
                itemName = await anyPrompt('string', true)
                commandHandler(socket, `GiveItem ` + steam64Id.toString() + ' ' + itemName)
                commandPrompt(socket)
            }
            if (selected.command === 'GiveCash') {
				console.log(await commandHandler(socket, 'RefreshList'))
				console.log('pick the steamID of the player you want to give money from the list above')
                steam64Id = await anyPrompt('steamId64', true)
				console.log('enter the amount of money')
				cashAmt = await anyPrompt('int', true)
                commandHandler(socket, `GiveCash ` + steam64Id.toString() + ' ' + cashAmt)
                commandPrompt(socket)
            }
            if (selected.command === 'ServerInfo') {
                console.log(await commandHandler(socket, 'ServerInfo'))
                commandPrompt(socket)
            }

            if (selected.command === 'RefreshList') {
                console.log(await commandHandler(socket, 'RefreshList'))
                commandPrompt(socket)
            }

            if (selected.command === 'Disconnect') {
                console.log('Disconnecting..')
                socket.destroy();
                serverPrompt()
            }
        })();
    });


}


function teamPrompt() {
    return new Promise(resolve => {
        // find a good delimiter
        inquirer.prompt([{
            type: 'list',
            name: 'team',
            message: 'Select a Team',
            choices: ["Blue Team (Defenders)", "Red Team (Attackers)"],
        }, ]).then(selected => {
            (async() => {
                resolve(selected.team)
            })();
        });
    });
}


function textPrompt(type, goBack) {
    return new Promise(resolve => {
        inquirer.prompt([{
            message: "",
            type: "input",
            name: "input " + type,
        }, ]).then(selected => {
            (async() => {
                if (type === 'int' && selected.input.match(/^\d+$/)) {
                    resolve(selected.input)
                } else if (type === 'steamId64' && selected.input.length === 17 && selected.input.match(/^\d+$/)) {
                    resolve(selected.input)
                } else if (type === 'string') {
                    resolve(selected.input)
                } else {
                    resolve(false)
                }
            })();
        });
    });


}

function anyPrompt(type, goBack) {
    return new Promise(resolve => {
        inquirer.prompt([{
            message: "enter " + type,
            type: "input",
            name: "input",
        }, ]).then(selected => {
            (async() => {
                resolve(selected.input)
            })();
        });
    });
}

function reconnect(socket) {
    //reconnect on loss (max retries)
}

function spinServer(server) {
    return new Promise(resolve => {
        socket = net.Socket();
        socket.connect(server.port, server.ip, () => {});
        socket.on('error', function(err) {
            console.log(err)
            resolve(false)
        });
        socket.write(server.password + '\r\n')
        socket.once('data', function(data) {
            if (data.toString().startsWith('Authenticated=1')) {
                console.log('Login Successful!');
                (async() => {
                    resolve(socket)
                        //socket.playerList = testJson
                    socket.playerList = await commandHandler(socket, 'RefreshList')
                })();
                setInterval(function() {
                    (async() => {
                        socket.playerList = await commandHandler(socket, 'RefreshList')
                    })();
                }, 60000);


            }
        });
    });
}


commands = [{
    "name": "SwitchMap",
    "params": ["map", "mod"]
}, {
    "name": "ResetSND",
    "params": []
}, {
    "name": "RotateMap",
    "params": []
}, {
    "name": "Kick",
    "params": ["steamid"]
}, {
    "name": "Ban",
    "params": ["steamid"]
}, {
    "name": "Unban",
    "params": ["steamid"]
}, {
    "name": "SwitchTeam",
    "params": ["steamid", "teamid"]
}, {
    "name": "GiveItem",
    "params": ["steamid", "itemid"]
}, {
    "name": "GiveCash",
    "params": ["steamid", "CashAmt"]
}, {
    "name": "GiveTeamCash",
    "params": ["steamid", "CashAmt"]
}, {
    "name": "InspectPlayer",
    "params": ["steamid"]
}, {
    "name": "ServerInfo",
    "params": []
}, {
    "name": "Disconnect",
    "params": []
}, {
    "name": "RefreshList",
    "params": []
}];
