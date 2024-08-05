document.addEventListener("DOMContentLoaded", function () {
    getUser()
    getName()
    document.querySelector('.collectSelectName').addEventListener('change', function () {
        selectName();
    });
});

//@ STATE
/*
    "RECEBIDO CD DE: - FOR"
    "EM ROTA"
    "DESCARREGADO"
    "ENTREGA REALIZADA"
    "PROCESSO DE ENTREGA"
    "EM TRANSFERÊNCIA SECUNDÁRIA"
    "EMBARQUE RECEBIDO NO CD: - FOR"
    "RECEBIDO CD DE: - - FOR"
    "RETIRADO DA CAF ANTERIOR" 
 */

//: ----- Users name menu -----
function configOpen() {
    const config = document.querySelector(".config")
    if (window.getComputedStyle(config).top === "-600px") {
        config.style = "top: auto";
    } else {
        config.style = "top: -600px";
    }
}
function addUser() {
    const user = document.querySelector(".userADD").value.trim()
    let userName = localStorage.getItem("Username");
    let listUser
    if (userName) {
        listUser = userName + ', ' + user
    } else {
        listUser = user
    }
    if (user.length > 0) {
        localStorage.setItem("Username", listUser)
        getUser()
        getName()
        selectName()
    }
}
function addUser() {
    const user = document.querySelector(".userADD").value.trim()
    let userName = localStorage.getItem("Username");
    let listUser
    if (userName) {
        listUser = userName + ', ' + user
    } else {
        listUser = user
    }
    if (user.length > 0) {
        localStorage.setItem("Username", listUser)
        getUser()
        getName()
        selectName()
    }
}
function getUser() {
    const userName = localStorage.getItem("Username");
    const listaNomesContainer = document.querySelector(".config .namesUsers");
    listaNomesContainer.innerHTML = ''
    if (userName) {

        const listNames = userName.split(", ");
        listNames.sort();

        listNames.forEach(function (name) {
            const divElement = document.createElement("div");

            const spanElement = document.createElement("span");
            spanElement.textContent = name;

            const iconElement = document.createElement("iconify-icon");
            iconElement.className = "iconDelet";
            iconElement.onclick = function () {
                deletUser(name);
            };
            iconElement.setAttribute("icon", "jam:delete-f");

            divElement.appendChild(spanElement);
            divElement.appendChild(iconElement);

            listaNomesContainer.appendChild(divElement);
        });
    }
}
function deletUser(user) {
    const userName = localStorage.getItem("Username");
    const listNames = userName.split(", ");

    const indexToDelete = listNames.indexOf(user);

    if (indexToDelete !== -1) {
        listNames.splice(indexToDelete, 1);

        localStorage.setItem("Username", listNames.join(", "));

        getUser()
        getName()
        selectName()
    }
}
function getName() {
    //localStorage.setItem("Username", "Alan H. Silva, Natali alguma coisa, Ailson ferreira");
    const userName = localStorage.getItem("Username");

    const listNames = userName.split(", ");

    listNames.sort();

    const selectElement = document.querySelector(".collectSelectName");

    const optionsToRemove = Array.from(selectElement.children).filter(option => option.value !== "0");
    optionsToRemove.forEach(option => selectElement.removeChild(option));

    if (userName) {
        listNames.forEach(function (name, index) {
            const newOption = document.createElement("option");
            newOption.value = index + 1;
            newOption.text = name.trim();
            selectElement.add(newOption);
        });
    }
}
function selectName() {
    const name = document.querySelector("#name")
    const valueSelect = document.querySelector(".collectSelectName")

    const selectedOption = valueSelect.options[valueSelect.selectedIndex];

    const selectedValue = selectedOption.value;
    const selectedText = selectedOption.text;

    if (selectedValue > 0) {
        name.value = selectedText
        name.disabled = true
    } else {
        name.value = ""
        name.disabled = false
    }

}
//:----------------------------


//: --- Main ---
function getData() {

    const mainData = document.querySelector("#data1").value;
    const cafData = document.querySelector("#data2").value;
    const ticketsData = document.querySelector("#data3").value;
    
    const mainDataObject = createObjectData(mainData)
    const ticketsDataObject = createObjectTickets(ticketsData)

    const toCheckTicket = TicketChecker(mainDataObject, ticketsDataObject)

    const cafListMade = getCafs(toCheckTicket)

    const sates = getStateAvailable(mainData) // Take status available
    //console.log(sates);

    console.log(cafListMade);
}

function createObjectData(data) {
    if(data === "") {
        errorHandling(
            "Por favor, preencha o campo 'Dados Principais'."
        )
        return
    }

    // Function to extract the value within the brackets
    function extractRouterValue(router) {
        const match = router.match(/\[(.*?)\]/);
        return match ? match[1] : '';
    }

    // Check if date is a string and converts to an array
    if (typeof data === 'string') {
        data = data.trim().split('\n'); // Divide the string into lines and removes extra blank spaces
    }

    // Check if date is an array
    if (!Array.isArray(data)) {
        throw new Error('Invalid input: data must be a string or an array of strings');
    }

    // Check if the first line is a header
    const header = data[0].split('\t');
    const hasHeader = header[0].toLowerCase() === 'awb' && header.length >= 5;

    // If there is a header, remove it
    if (hasHeader) {
        data.shift();
    }

    // Turning data into validation objects
    return data.map(line => {
        const parts = line.split('\t');
        
        // Checks if the line has at least 6 parts (including the 'driver' field and the 'state' field prior to it)
        if (parts.length < 5) {
            errorHandling(
                "Os dados fornecidos no campo 'Dados Principais' são inválidos. Por favor, verifique e corrija as informações antes de enviar.",
                new Error(`Invalid line format: ${line}`)
            );
            return null; // Returns null to indicate invalid line
        }

        const [awb, router, boarding, caf, state, driver] = parts;
        return {
            AWB: awb,
            router: extractRouterValue(router),
            boarding: boarding,
            CAF: caf,
            state: state,
            driver: driver,
            ticket: ""
        };
    }).filter(item => item !== null);
}

function createObjectTickets(data) {
    if(data === '') return;

    // Check if date is a string and converts to an array
    if (typeof data === 'string') {
        data = data.trim().split('\n'); // Divide the string into lines and removes extra blank spaces
    }

    // Check if date is an array
    if (!Array.isArray(data)) {
        throw new Error('Invalid input: data must be a string or an array of strings');
    }

    // Check if the first line is a header
    const header = data[0].split('\t');
    const hasHeader = header[0].toLowerCase() === 'awb' && header.length >= 2;

    // If there is a header, remove it
    if (hasHeader) {
        data.shift();
    }

    // Turning data into validation objects
    return data.map(line => {
        const parts = line.split('\t');
        
        // Check if the line has at least 2 parts
        if (parts.length < 2) {
            errorHandling(
                "Os dados fornecidos no campo 'Dados Tickets' são inválidos. Por favor, verifique e corrija as informações antes de enviar.",
                new Error(`Invalid line format: ${line}`)
            );
            return null; // Returns null to indicate invalid line
        }

        const [awb, ticket] = parts;
        return {
            AWB: awb, 
            ticket: ticket 
        };
    }).filter(item => item !== null); // Filters Invalid Items
}

function TicketChecker(dataMain, dataTicket) {
    // Itera about each item in Datamain
    return dataMain.map(mainItem => {
        // Finds the corresponding item in Dataticket with the same AWB
        let ticketItem = false
        if(!(dataTicket === '' || dataTicket === undefined)){
            ticketItem = dataTicket.find(ticketItem => ticketItem.AWB === mainItem.AWB);
        }

        // If you found a corresponding item, check the ticket message
        if (ticketItem) {
            if (ticketItem.ticket.includes(`Encomenda auditada - 5 : ${mainItem.AWB}`)) {
                mainItem.ticket = "audited";
            } else {
                mainItem.ticket = "notAuthenticated";
            }
        } else {
            // If you have not found a corresponding item, it defines it as "Notauthenticated"
            if(dataTicket === undefined || dataTicket === ''){
                mainItem.ticket = "undefined" 
            }else{
                mainItem.ticket = "notAuthenticated";
            }
        }

        return mainItem;
    });
}

function getCafs(data) {
    if (!Array.isArray(data)) {
        throw new Error('Invalid input: data must be an array of objects');
    }

    const atTheBase = ["DESCARREGADO", "RECEBIDO CD DE: - FOR"];
    const inCAF = ["EM ROTA", "EM TRANSFERÊNCIA SECUNDÁRIA"];
    const inStreet = ["ENTREGA REALIZADA", "PROCESSO DE ENTREGA"];

    const groupedData = data.reduce((acc, item) => {
        const { AWB, router, boarding, CAF, state, driver, ticket } = item;

        if (CAF === '0') return acc;

        if (!acc[CAF]) {
            acc[CAF] = {
                AWBS: new Set(),
                routers: {},
                states: {},
                drivers: new Set(),
                boardings: new Set(),
                ticket: ticket
            };
        }

        acc[CAF].AWBS.add(AWB);

        if (!acc[CAF].routers[router]) {
            acc[CAF].routers[router] = 0;
        }
        acc[CAF].routers[router]++;

        if (!acc[CAF].states[state]) {
            acc[CAF].states[state] = 0;
        }
        acc[CAF].states[state]++;

        acc[CAF].drivers.add(driver);
        acc[CAF].boardings.add(boarding);

        return acc;
    }, {});

    const result = {};

    for (const [CAF, value] of Object.entries(groupedData)) {
        const { AWBS, routers, states, drivers, boardings, ticket } = value;

        // Determine the most frequent router
        const mostFrequentRouter = Object.entries(routers).reduce((a, b) => (b[1] > a[1] ? b : a))[0];

        // Determine the most frequent state
        const stateCounts = { atTheBase: 0, inCAF: 0, inStreet: 0 };
        for (const [state, count] of Object.entries(states)) {
            if (atTheBase.includes(state)) {
                stateCounts.atTheBase += count;
            } else if (inCAF.includes(state)) {
                stateCounts.inCAF += count;
            } else if (inStreet.includes(state)) {
                stateCounts.inStreet += count;
            }
        }

        const mostFrequentState = Object.entries(stateCounts).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
        const stateValue = stateCounts[mostFrequentState] > 0 ? mostFrequentState : 'undefined';

        result[CAF] = {
            CAF: CAF,
            AWBS: Array.from(AWBS),
            router: mostFrequentRouter,
            state: stateValue,
            driver: Array.from(drivers)[0], // Assuming driver is the same for all entries in a CAF
            boarding: Array.from(boardings),
            ticket: ticket
        };
    }

    return result;
}

//:-------------


//: --- Helps ---
function redirectHelp() {
    const path = window.location.href;
    const lastIndex = path.lastIndexOf("/");

    if (lastIndex !== -1) {
        const newPath = path.substring(0, lastIndex);
        const newURL = newPath + "/components/help.html";

        window.location.href = newURL;
    } else {
        console.error("Não foi possível determinar o caminho correto.");
    }
}
function errorHandling(errMsg, error) { 
    const body = document.querySelector("body");

    const boxBC = document.createElement("div");
    boxBC.classList.add("errorBox");

    const spanErr = document.createElement("span");
    spanErr.classList.add("error");
    spanErr.textContent = errMsg;

    boxBC.appendChild(spanErr);

    body.appendChild(boxBC);

    setTimeout(() => {
        boxBC.remove();
    }, 2000);
    
    if (error) {
        console.error('Ocorreu um erro: ', error);
    }
}
function getStateAvailable(data) {
    const mainDataObject = createObjectData(data);
    const states = mainDataObject.map(item => item.state);
    const uniqueStates = [...new Set(states)];
    return uniqueStates;
}
//:-------------