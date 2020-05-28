const inquirer = require('inquirer');
const net = require('net')
const fs = require('fs');
var servers = require('./servers.json');

var maps = 'ID              | Mode  | Map\n---------------------------------\nUGC1664873782   | SND   | Dust II\nUGC1996841374   | SND   | Prodigy\nUGC1695916905   | SND   | Cache\nUGC2007531312   | SND   | Sitalas\nUGC1996841374   | SND   | The Suburbs\nUGC2019786310   | SND   | de_seaside\nUGC2013358920   | SND   | Pipes\nUGC1921083944   | SND   | Colombian Jungle\nUGC1080743206   | SND   | Office HQ\nUGC1661803933   | SND   | Mirage\nUGC1884572674   | SND   | Terminal MW2\nUGC1739104662   | DM    | Rust\nUGC1401905027   | SND   | Lake\nUGC1661039078   | SND   | Inferno\nUGC1758245796   | SND   | Nuke Town 2025\nUGC1397109851   | SND   | Militia\nUGC1732095389   | DM    | Shipment\nUGC1679531002   | SND   | Industry 4.21\nUGC1717551845   | SND   | Nuke\nUGC1677995860   | SND   | Train\nUGC1701860633   | SND   | Oilrig\nUGC1984149656   | SND   | Mcdonalds\nUGC1844407640   | SND   | Italy\nUGC1675048033   | DM    | aim_map\nUGC1701685151   | SND   | Cobblestone\nUGC1702579126   | SND   | Ritalo\nUGC1676961583   | SND   | Overpass\nUGC1677185215   | DM    | duel_aim\nUGC957591808    | DM    | Chess\nUGC1522109413   | SND   | Crash\nUGC1543656302   | SND   | Carentan WW2\nUGC1711450123   | SND   | Vertigo\nUGC915741355    | SND   | Rush\nUGC1675848285   | DM    | aim_usp\nUGC1578183847   | SND   | United 747\nUGC963409179    | SND   | Aztec Beta ready\nUGC1944987722   | SND   | Manor 2020\nUGC2029069487   | SND   | Chateau\nUGC1937414766   | SND   | de_legend\nUGC1693257484   | DM    | Pool_day\nUGC1118987487   | SND   | Bridge Crossing\nUGC1841772559   | DM    | Shoots\nUGC1864436286   | SND   | Assault\nUGC1411741987   | DM    | 4.21 The Office (Dunder Mifflin)\nUGC974295170    | DM    | Shipment Beta ready\nUGC1933240808   | SND   | Vertigo 2019\nUGC2008583441   | DM    | Time Heist\nUGC2045258277   | SND   | Berlin\nUGC2050496129   | SND   | Reachsky\nUGC1917540326   | SND   | Medical\nUGC1921083944   | SND   | Columbian Jungle\nUGC2008936831   | SND   | Gravity\n'

var items = '---,Cost,KillBonus,BaseDamage,ArmourDamage,ArmourPenetration,HelmetDamage,HelmetBleed\nak,1400,600,20,35,60,100,50\nuzi,950,600,20,20,10,50,25\n57,500,300,20,25,100,100,75\nautosniper,3500,100,35,60,100,100,100\nkar98,1600,800,50,60,100,100,100\nhunting,1200,0,50,60,100,100,100\nautoshotgun,1800,100,15,15,10,25,10\nlmga,3000,100,20,60,100,100,75\nsawedoff,1000,600,20,25,10,50,10\ndrumshotgun,4200,100,15,15,10,25,10\nmp5,1600,400,20,30,10,25,25\n1911,200,800,25,25,10,100,50\nde,800,600,40,35,100,100,100\nak47,2500,300,25,60,100,100,100\nak12,2700,300,20,45,100,100,75\nsock,500,600,20,30,10,50,50\nar,2700,300,20,45,100,100,75\nshotgun,1500,600,15,15,10,25,0\nsmg,1200,800,25,25,10,100,50\naug,2300,300,20,45,100,100,75\np90,2000,300,20,20,10,25,75\nrevolver,800,600,50,35,100,100,100\nflash,200,1200,0,0,0,0,0\nsmoke,300,0,0,0,0,0,0\nknife,100,1200,0,0,0,0,0\ngrenade,600,0,0,80,90,0,0\npliers,800,0,0,0,0,0,0\nsupp_pistol,250,-50,,,,,\nsupp_rifle,500,-200,,,,,\nscope,400,0,,,,,\ngrip_angled,300,-100,,,,,\ngrip_vertical,300,-150,,,,,\nacog,400,-50,,,,,\nholo,500,-150,,,,,\nreddot,500,-150,,,,,\n'

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
				console.log(maps + '\nto change the map use the corresponding UGC-ID')
                map = await anyPrompt('map', true)
                mod = await anyPrompt('mod', true)
				if (!mod) {
					mod = 'SND'
				}
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
            if (selected.command === 'SetPlayerSkin') {
				console.log(items)
				console.log(await commandHandler(socket, 'RefreshList'))
				console.log('pick the steamID of the player to skin from the list above')
                steam64Id = await anyPrompt('steamId64', true)
				console.log('clown\nprisoner\nnaked\nfarmer\nrussian\nnato\n')
				console.log('enter the skinID you want to set')
                skinID = await anyPrompt('string', true)
                commandHandler(socket, `SetPlayerSkin ` + steam64Id.toString() + ' ' + skinID)
                commandPrompt(socket)
            }
            if (selected.command === 'SetLimitedAmmoType') {
				console.log('type a number between 0 and 2')
				ammoID = await anyPrompt('int', true)
                commandHandler(socket, 'SetLimitedAmmoType ' + ammoID.tostring())
                commandPrompt(socket)
            }
            if (selected.command === 'GiveItem') {
				console.log(items)
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



function skinPrompt() {
    return new Promise(resolve => {
        inquirer.prompt([{
            type: 'list',
            name: 'skin',
            message: 'select a skin',
            choices: ["clown", "prisoner", "naked", "farmer", "russian", "nato"],
        }, ]).then(selected => {
            (async() => {
                resolve(selected.skin)
            })();
        });
    });
}



function teamPrompt() {
    return new Promise(resolve => {
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


commands = [
{
    "name": "ServerInfo",
    "params": []
}, {
    "name": "RefreshList",
    "params": []
}, {
    "name": "InspectPlayer",
    "params": ["steamid"]
}, {
    "name": "RotateMap",
    "params": []
}, {
    "name": "SwitchMap",
    "params": ["map", "mod"]
}, {
    "name": "ResetSND",
    "params": []
}, {
    "name": "SwitchTeam",
    "params": ["steamid", "teamid"]
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
    "name": "SetPlayerSkin",
    "params": ["steamid", "skinid"]
}, {
    "name": "SetLimitedAmmoType",
    "params": ["typeid"]
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
    "name": "Disconnect",
    "params": []
}];
