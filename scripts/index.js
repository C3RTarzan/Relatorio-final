document.addEventListener("DOMContentLoaded", function () {
    getUser()
    getName()

    getLocalStorage()

    updateDate()

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
    if(isEmptyOrUndefined(userName)) return
    

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
    const userName = localStorage.getItem("Username");

    if(isEmptyOrUndefined(userName)) return

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
    console.log("Loading..."); //? Console Debugging
    const mainData = document.querySelector("#data1").value; //@ Get data from part
    const cafData = document.querySelector("#data2").value; //@ Get data from caf
    const ticketsData = document.querySelector("#data3").value; //@ Get data from ticket

    const mainDataObject = createObjectData(mainData, true) //@ Create part list
    const mianSecDataObject = createObjectData(cafData, false) //@ Create part secondary list  
    const ticketsDataObject = createObjectTickets(ticketsData) //@ Create ticket list

    const removeRouteStateData = RemoveState(mainDataObject) //@ Remove parameter from "FOR" from "Data"
    const removeRouteStateSecData = RemoveState(mianSecDataObject) //@ Remove parameter from "FOR" from "secData"
    
    const completeData = mainWithCAF(removeRouteStateData, removeRouteStateSecData) //@ Join the primary data with the secondary data

    const toCheckTicket = TicketChecker(completeData || removeRouteStateData, ticketsDataObject); //@ Verify is audited

    const cardsTreatment = recoveryCards(toCheckTicket) //@ Remove part cards (parts, cards)

    const cafListMade = getCafs(cardsTreatment) //@ Create object with the CAF's
    const orders = alphabeticalOrdering(cafListMade) //@ Orvernment by alphabetical order

    const values = getValues(orders, cardsTreatment) //@ Take total values

    createTable(orders, values)

    const sates = getStateAvailable(mainData) //? Valid states of the pieces

    console.log("Concluded!"); //? Console Debugging
}

function createObjectData(data, verification) {

    let tipyData = "";

    if(verification){
        tipyData = "Dados Principais"
    }else{
        tipyData = "Dados CAF"
    }

    if (data === "" && verification) {
        errorHandling(
            `Por favor, preencha o campo '${tipyData}'.`
        )
        return
    }

    if(data === "" && !verification){
        return
    }

    // Function to extract the value within the brackets
    function extractRouterValue(router) {
        const match = router.match(/\[(.*?)\]/);
        return match ? match[1] : '';
    }
    function extractRouterStateValue(router){
        const state = router.split("-")    
        return state[1]
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
                `Os dados fornecidos no campo '${tipyData}' são inválidos. Por favor, verifique e corrija as informações antes de enviar.`, `O argumento '${line}' é inválido no ${tipyData}. Por favor, verifique e tente novamente ( Argumentos válidos: AWB, Rota, ID do embarque, ID da caf, Descrição do status, Nome do Motorista ).`
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
            ticket: "",
            routerState: extractRouterStateValue(router)
        };
    }).filter(item => item !== null);
}

function createObjectTickets(data) {
    if(isEmptyOrUndefined(data)) return

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
                `Os dados fornecidos no campo Dados Tickets são inválidos. Por favor, verifique e corrija as informações antes de enviar.`, `O argumento '${line}' é inválido no Dados Tickets. Por favor, verifique e tente novamente ( Argumentos válidos: AWB, Descrição do Ticket).`
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

function RemoveState(data){
    if(isEmptyOrUndefined(data)) return
    
    //Filters objects with RouterState equal to "for"
    return data.filter(item => item.routerState === "FOR");
}

function mainWithCAF(dataMain, dataSec) {
    if(isEmptyOrUndefined(dataMain) || isEmptyOrUndefined(dataSec)) return null;

    const mergedData = [...dataMain, ...dataSec];

    const uniqueData = mergedData.reduce((acc, item) => {
        if (!acc.some(existingItem => existingItem.AWB === item.AWB)) {
            acc.push(item);
        }
        return acc;
    }, []);

    return uniqueData;
}

function TicketChecker(dataMain, dataTicket) {

    if(isEmptyOrUndefined(dataMain)) return;

    // Itera about each item in Datamain
    return dataMain.map(mainItem => {
        // Finds the corresponding item in Dataticket with the same AWB
        let ticketItem = false
        if (!(dataTicket === '' || dataTicket === undefined)) {
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
            if (dataTicket === undefined || dataTicket === '') {
                mainItem.ticket = "undefined"
            } else {
                mainItem.ticket = "notAuthenticated";
            }
        }

        return mainItem;
    });
}

function getCafs(data) {
    if(isEmptyOrUndefined(data)) return

    const dataParts = data.parts;
    
    if (!Array.isArray(dataParts)) {
        throw new Error('Invalid input: data must be an array of objects');
    }

    const atTheBase = ["DESCARREGADO", "RECEBIDO CD DE: - FOR"];
    const inCAF = ["EM ROTA", "EM TRANSFERÊNCIA SECUNDÁRIA"];
    const inStreet = ["ENTREGA REALIZADA", "PROCESSO DE ENTREGA"];

    const groupedData = dataParts.reduce((acc, item) => {
        const { AWB, router, boarding, CAF, state, driver, ticket } = item;

        if(CAF === '0') return acc;

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
        let mostFrequentRouter = Object.entries(routers).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
        if(CAF === '0'){
            mostFrequentRouter = 'MTS'
        }

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
            routerList: routers,
            state: stateValue,
            driver: Array.from(drivers)[0], // Assuming driver is the same for all entries in a CAF
            boarding: Array.from(boardings),
            ticket: ticket
        };
    }

    return result;
}

function recoveryCards(data) {

    if(isEmptyOrUndefined(data)) return

    const checkList = ["NUBT", "BNUK", "WILL"];
    const result = {
        cards: [],
        parts: []
    };

    data.forEach(item => {
        const awbPrefix = item.AWB.slice(0, 4); // Extracts the first 4 characters from AWB

        if (checkList.includes(awbPrefix)) {
            result.cards.push(item);
        } else {
            result.parts.push(item);
        }
    });

    return result;
}

function alphabeticalOrdering(data) {
    if(isEmptyOrUndefined(data)) return
    
    const regexZeroNumLetter = /^0(\d+[A-Z])$/; // 01A, 06B
    const regexNumLetterNum = /^(\d+[A-Z])(\d+)$/; // 1B1, 8C1
    const regexTwoLettersNum = /^([A-Z]{2}\d+)$/; // CA1, MA1
    const regexLetterTwoNums = /^([A-Z]\d{2})$/; // V01, S10

    const getNormalizedValue = (router) => {
        if (regexZeroNumLetter.test(router)) {
            return router.replace(/^0/, ''); // Remove leading 0
        } else if (regexNumLetterNum.test(router)) {
            return router.replace(/\d+$/, ''); // Remove last digit for comparison
        } else if (regexTwoLettersNum.test(router)) {
            return router; // No change needed
        } else if (regexLetterTwoNums.test(router)) {
            return router; // No change needed
        }
        return router; // Default case
    };

    const getLastNumber = (router) => {
        const match = router.match(/\d+$/); // Extract last number
        return match ? parseInt(match[0], 10) : 0;
    };

    function compareRouter(a, b) {
        const normA = getNormalizedValue(a.router);
        const normB = getNormalizedValue(b.router);

        if (regexTwoLettersNum.test(a.router) && regexTwoLettersNum.test(b.router)) {
            // Compare two letters followed by a number
            return a.router.localeCompare(b.router);
        } else if (regexLetterTwoNums.test(a.router) && regexLetterTwoNums.test(b.router)) {
            // Compare letter followed by two numbers
            return a.router.localeCompare(b.router);
        } else if (regexNumLetterNum.test(a.router) && regexNumLetterNum.test(b.router)) {
            // Compare based on normalized values and then by the last number
            const normalizedComparison = normA.localeCompare(normB);
            if (normalizedComparison === 0) {
                return getLastNumber(a.router) - getLastNumber(b.router);
            }
            return normalizedComparison;
        } else {
            // Normalize and compare the routers based on their normalized values
            return normA.localeCompare(normB);
        }
    }

    // Extract the values of the object `data` for an array, if `data` is an object
    const valuesArray = Array.isArray(data) ? data : Object.values(data);

    // Order the values
    valuesArray.sort(compareRouter);

    return valuesArray;
}

function getValues(data, values){
    if(isEmptyOrUndefined(data) || isEmptyOrUndefined(values) || !Array.isArray(data)) return 

    const listData = values.parts
    const listDataCards = values.cards 
    
    let volumesInCAF = 0;
    let volumesWithoutCAF = 0; 
    let volumes = 0
    let totalCAFs = 0;
    let auditedCAFs = 0;
    let dispatchedCAFs = 0;
    let volumesInCAFCards = 0
    const items = [];

    const uniqueCAFs = new Set();

    data.forEach(item => {
        // Counting volumes in CAF
        if (item.AWBS && Array.isArray(item.AWBS)) {
            volumesInCAF += item.AWBS.length;
        }

        // Checking if the CAF is unique and counting total CAFs
        if (item.CAF && !uniqueCAFs.has(item.CAF)) {
            uniqueCAFs.add(item.CAF);
            totalCAFs += 1;
        }

        // Counting audited CAFs
        if (item.ticket && item.ticket.toLowerCase() === "audited") {
            auditedCAFs += 1;
        }

        // Counting dispatched CAFs
        if (item.state && item.state.toLowerCase() === "instreet") {
            dispatchedCAFs += 1;
        }
    });

    listData.forEach(item =>{
        if(item.router !== 'ECT'){
            volumes += 1
        }
        if(item.CAF === '0' && item.router !== 'ECT'){
            volumesWithoutCAF += 1
        } 
        if(item.boarding){
            //uniqueListManager(items).addItem(item.boarding);
        }
    });

    listDataCards.forEach(item =>{
        
    })

    return {
        volumes,
        volumesInCAF,
        totalCAFs,
        auditedCAFs,
        //boarding: uniqueListManager.getItems(),
        dispatchedCAFs,
        volumesWithoutCAF,
        volumesInCAFCards
    };
}

function createTable(data, data2) {
    if(isEmptyOrUndefined(data) && isEmptyOrUndefined(data2)) return

    localStorageCreate(data, data2)
    
    const mainSheet = document.querySelector('.mainSheet');
    let lastInsertedElement = document.querySelector('.headerMainSheet');  // Starts with Headermainsheet
    
    // Clean all elements 'added' and 'addbg' existing
    const addedElements = mainSheet.querySelectorAll('.added, .addedBG');
    addedElements.forEach(element => element.remove());
    
    data.forEach((item, index) => {
        const addedClass = index % 2 === 0 ? 'added' : 'added addedBG';

        let stateItem;
        if(item.state === "inCAF"){
            stateItem = "Em CAF"
        }else if(item.state ===  "inStreet"){
            stateItem = "Na Rua"
        }else if(item.state === "atTheBase"){
            stateItem = "Em base"
        }else{
            stateItem = item.state
        }

        let stateTicket;
        if(item.ticket === "notAuthenticated"){
            stateTicket = "Não Auditado"
        }else if(item.ticket === "audited"){
            stateTicket = "Auditado"
        }else{
            stateTicket = "Indefinido"
        }
        const itemHTML = `
            <div class="${addedClass} CL_${item.state}">
                <div class="bcRouter">
                    <span>${item.router}</span>
                </div>
                <div class="bcAggregate">
                    <span>${item.driver}</span>
                </div>
                <div class="bcCAF">
                    <span>${item.CAF}</span>
                </div>
                <div class="bcAmount">
                    <span>${item.AWBS.length}</span>
                </div>
                <div class="bcState">
                    <span>${stateItem}</span>
                </div>
                <div class="bcSituation">
                    <span>${stateTicket}</span>
                </div>
            </div>
        `;
    
        lastInsertedElement.insertAdjacentHTML('afterend', itemHTML);
        lastInsertedElement = lastInsertedElement.nextElementSibling; // Atualiza a referência para o último elemento inserido
    });

    const footerSheet = document.querySelector('.footerSheet');
    footerSheet.querySelector(".volumefooter span").innerHTML = `VOLUMES EM CAF: ${data2.volumesInCAF}`;
    footerSheet.querySelector(".Madefooter span").innerHTML = `CAF’S FEITAS: ${data2.totalCAFs}`;
    footerSheet.querySelector(".auditedfooter span").innerHTML = `CAF’S AUDITADA: ${data2.auditedCAFs}`;
    footerSheet.querySelector(".issuedfooter span").innerHTML = `CAF’S EXPEDIDAS: ${data2.dispatchedCAFs}`;
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
    }, 3000);

    if (error) {
        console.error('Ocorreu um erro: ', error);
    }
}
function getStateAvailable(data) {

    if(isEmptyOrUndefined(data)) return

    const mainDataObject = createObjectData(data);
    const states = mainDataObject.map(item => item.state);
    const uniqueStates = [...new Set(states)];
    return uniqueStates;
}
function isEmptyOrUndefined(data) {
    return data === '' || data === undefined || data === null || data === "undefined";
}
function createExcelFormat() {
    const sheet = document.querySelector('.sheet');
    
    if (!sheet) {
        errorHandling("Tabela não encontrada.")
        return;
    }

    // Extracting the data
    let textData = '';
    
    // Header
    const headerElements = sheet.querySelectorAll('.headerMainSheet .bcRouter, .headerMainSheet .bcAggregate, .headerMainSheet .bcCAF, .headerMainSheet .bcAmount, .headerMainSheet .bcState, .headerMainSheet .bcSituation');
    textData += Array.from(headerElements).map(el => el.innerText).join('\t') + '\n';
    
    // Rows
    const rows = sheet.querySelectorAll('.mainSheet .added, .mainSheet .addedBG');
    rows.forEach(row => {
        const columns = row.querySelectorAll('.bcRouter, .bcAggregate, .bcCAF, .bcAmount, .bcState, .bcSituation');
        textData += Array.from(columns).map(col => col.querySelector('span').innerText).join('\t') + '\n';
    });

    // Footer
    const footerElements = sheet.querySelectorAll('.footerSheet .volumefooter, .footerSheet .Madefooter, .footerSheet .auditedfooter, .footerSheet .issuedfooter');
    textData += '\n'; // Add a newline before footer section
    footerElements.forEach((el, index) => {
        textData += el.querySelector('span').innerText + '\n';
    });

    // Copy to the transfer area
    navigator.clipboard.writeText(textData).then(() => {
        console.log("Tabela Copiada.");
    }).catch(err => {
        errorHandling("Erro ao copiar tebela.", err);
    });
}
function localStorageCreate(data, data2){
    localStorage.setItem('main', JSON.stringify(data));
    localStorage.setItem('value', JSON.stringify(data2));
}
function getLocalStorage(){
    if (isEmptyOrUndefined(localStorage.getItem("main")) && isEmptyOrUndefined(localStorage.getItem("value"))) return

    const main = localStorage.getItem('main');
    const myObjectMain = JSON.parse(main);

    const value = localStorage.getItem('value');
    const myObjectValue = JSON.parse(value);

    createTable(myObjectMain, myObjectValue)
}
async function generateImage() {
    createExcelFormat()
    

    const content = document.querySelector('.sheet');
    const button = document.querySelector('.buttonDn button');

    if (!content || !button) {
        console.error('Content or button not found.');
        return;
    }

    // Store the original styles
    const originalStyles = {
        buttonDisplay: button.style.display,
        contentStyles: {
            width: content.style.width,
            padding: content.style.padding,
        }
    };

    // Hide the button and adjust the width of elements
    button.style.display = "none";
    content.style.width = "100%";
    content.style.padding = "0";

    const scale = 4;  // Adjust the scale as necessary to improve quality
    const a4Width = 794;  // A4 sheet width in pixels at 96 DPI
    const a4Height = 1123;  // A4 sheet height in pixels at 96 DPI

    // Adjust content size to fit an A4 sheet
    const contentWidth = content.offsetWidth;
    const contentHeight = content.offsetHeight;
    const widthRatio = a4Width / contentWidth;
    const heightRatio = a4Height / contentHeight;
    const fitScale = Math.min(widthRatio, heightRatio);

    const options = {
        width: contentWidth * fitScale * scale,
        height: contentHeight * fitScale * scale,
        style: {
            transform: `scale(${fitScale * scale})`,
            transformOrigin: 'top left',
            width: `${contentWidth}px`,
            height: `${contentHeight}px`,
        }
    };

    try {
        const dataUrl = await domtoimage.toPng(content, options);

        // Restore the original styles
        button.style.display = originalStyles.buttonDisplay;
        content.style.width = originalStyles.contentStyles.width;
        content.style.padding = originalStyles.contentStyles.padding;

        // Get the current date
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0'); // Add zero to the left if necessary
        const month = String(today.getMonth() + 1).padStart(2, '0'); // January is 0
        const formattedDate = `${day}.${month}`;

        // Configure the download button
        button.disabled = false;
        button.onclick = function () {
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `Report ${formattedDate}.png`;
            link.click();
        };

        // Trigger a click to download immediately after the image is generated
        button.click();

    } catch (error) {
        // Restore the button if an error occurs
        button.style.display = originalStyles.buttonDisplay;
        console.error('An error occurred while generating the image:', error);
    }
}
function updateDate(){
    const dateSpan = document.querySelector('.herderSheet .date span');
    if(isEmptyOrUndefined(dateSpan)) return;
    
    // Get the current date
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0'); // Add zero to the left if necessary
    const month = String(today.getMonth() + 1).padStart(2, '0'); // January is 0
    const formattedDate = `${day}/${month}`;

    // Update the element content
    dateSpan.innerHTML = formattedDate;
}
function createUniqueList(items) {
    return {
        addItem: function(item) {
            // Checks if the item already exists on the list
            if (!items.includes(item)) {
                items.push(item); // Add the item if it does not exist
            } else {
            }
        },
        getItems: function() {
            return items;
        }
    };
}
//:-------------