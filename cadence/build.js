const fs = require('fs');
const path = require('path');
const transactionsPath = path.join(__dirname, 'transactions', '/')
const scriptsPath = path.join(__dirname, 'scripts', '/')

const convertCadenceToJs = async () => {
    let resultingJs = await require('cadence-to-json')({
        transactions: [ transactionsPath ],
        scripts: [ scriptsPath ],
        config: require('../flow.json')
    })

    const scripts = {}
    const transactions = {}

    Object.keys(resultingJs.scripts).forEach(scriptName => {
        const cadence = resultingJs.scripts[scriptName]
        scripts[scriptName] = cadence.replace(/import\s+"(\w+)"/g, (match, contractName) => {
            return `import ${contractName} from 0x${contractName}`
        })
    })

    Object.keys(resultingJs.transactions).forEach(txName => {
        const cadence = resultingJs.transactions[txName]
        transactions[txName] = cadence.replace(/import\s+"(\w+)"/g, (match, contractName) => {
            return `import ${contractName} from 0x${contractName}`
        })
    })

    resultingJs.scripts = scripts
    resultingJs.transactions = transactions

    fs.writeFile('./flow/CadenceToJson.json', JSON.stringify(resultingJs), (err) => {
        if (err) {
            console.error("Failed to read CadenceToJs JSON");
            console.error(err)
            process.exit(1)
        }
    })
}

convertCadenceToJs()