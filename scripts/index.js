document.addEventListener("DOMContentLoaded", function () {
    getUser()
    getName()

    getLocalStorage()

    updateDate()

    createSelectElement()

    createMessage()

    document.querySelector('.collectSelectName').addEventListener('change', function () {
        selectName();
        createMessage()
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

    createSelectElement()

    createMessage()

    const sates = getStateAvailable(mainData) //? Valid states of the pieces

    console.log("Concluded!"); //? Console Debugging
}

function createObjectData(data, verification) {

    let tipyData = "";

    if (verification) {
        tipyData = "Dados Principais"
    } else {
        tipyData = "Dados CAF"
    }

    if (data === "" && verification) {
        errorHandling(
            `Por favor, preencha o campo '${tipyData}'.`
        )
        return
    }

    if (data === "" && !verification) {
        return
    }

    // Function to extract the value within the brackets
    function extractRouterValue(router) {
        const match = router.match(/\[(.*?)\]/);
        return match ? match[1] : '';
    }
    function extractRouterStateValue(router) {
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
    if (isEmptyOrUndefined(data)) return

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

function RemoveState(data) {
    if (isEmptyOrUndefined(data)) return

    //Filters objects with RouterState equal to "for"
    return data.filter(item => item.routerState === "FOR");
}

function mainWithCAF(dataMain, dataSec) {
    if (isEmptyOrUndefined(dataMain) || isEmptyOrUndefined(dataSec)) return null;

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
    if (isEmptyOrUndefined(dataMain)) return;

    // Filters Dataticket items to keep only those whose ticket starts with "Encomenda auditada - 5"
    const filteredTickets = (dataTicket || []).filter(ticketItem =>
        ticketItem.ticket.startsWith("Encomenda auditada - 5")
    );

    // Itera about each item in Datamain
    return dataMain.map(mainItem => {
        // Finds the corresponding item in FilteredTickets with the same AWB
        let ticketItem = filteredTickets.find(ticketItem => ticketItem.AWB === mainItem.AWB);

        // If you found a corresponding item, check the ticket message
        if (ticketItem) {
            if (ticketItem.ticket.includes(`Encomenda auditada - 5 : ${mainItem.AWB}`)) {
                mainItem.ticket = "audited";
            } else {
                mainItem.ticket = "notAuthenticated";
            }
        } else {
            // If you have not found a corresponding item, it defines it as "Notauthenticated" or "UNDEFINED"
            mainItem.ticket = (dataTicket === undefined || dataTicket === '') ? "undefined" : "notAuthenticated";
        }

        return mainItem;
    });
}


function getCafs(data) {
    if (isEmptyOrUndefined(data)) return

    const dataParts = data.parts;

    if (!Array.isArray(dataParts)) {
        throw new Error('Invalid input: data must be an array of objects');
    }

    const atTheBase = ["DESCARREGADO", "RECEBIDO CD DE: - FOR"];
    const inCAF = ["EM ROTA"];
    const inStreet = ["ENTREGA REALIZADA", "PROCESSO DE ENTREGA", "EM TRANSFERÊNCIA SECUNDÁRIA"];

    const groupedData = dataParts.reduce((acc, item) => {
        const { AWB, router, boarding, CAF, state, driver, ticket } = item;

        if (CAF === '0') return acc;

        if (!acc[CAF]) {
            acc[CAF] = {
                AWBS: new Set(),
                routers: {},
                states: {},
                drivers: new Set(),
                boardings: new Set(),
                tickets: new Set()
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
        acc[CAF].tickets.add(ticket);
        return acc;

    }, {});

    const result = {};

    for (const [CAF, value] of Object.entries(groupedData)) {
        const { AWBS, routers, states, drivers, boardings, tickets } = value;

        // Determine the most frequent router
        let mostFrequentRouter = Object.entries(routers).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
        if (CAF === '0') {
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

        // Determine the ticket status, prioritizing "audited"
        const ticketValue = tickets.has('audited') ? 'audited' : Array.from(tickets).find(ticket => ticket !== 'audited') || 'undefined';

        result[CAF] = {
            CAF: CAF,
            AWBS: Array.from(AWBS),
            router: mostFrequentRouter,
            routerList: routers,
            state: stateValue,
            driver: Array.from(drivers)[0], // Assuming driver is the same for all entries in a CAF
            boarding: Array.from(boardings),
            ticket: ticketValue
        };
    }

    return result;
}

function recoveryCards(data) {

    if (isEmptyOrUndefined(data)) return

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
    if (isEmptyOrUndefined(data)) return

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

function getValues(data, values) {
    if (isEmptyOrUndefined(data) || isEmptyOrUndefined(values) || !Array.isArray(data)) return

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

    listData.forEach(item => {
        if (item.router !== 'ECT') {
            volumes += 1
        }
        if (item.CAF === '0' && item.router !== 'ECT') {
            volumesWithoutCAF += 1
        }
        if (item.boarding) {
            //uniqueListManager(items).addItem(item.boarding);
        }
    });

    listDataCards.forEach(item => {

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

//:-------------


//:---TableControl----

function createTable(data, data2) {
    if (isEmptyOrUndefined(data) && isEmptyOrUndefined(data2)) return

    localStorageCreate(data, data2)

    const mainSheet = document.querySelector('.mainSheet');
    let lastInsertedElement = document.querySelector('.headerMainSheet');  // Starts with Headermainsheet

    // Clean all elements 'added' and 'addbg' existing
    const addedElements = mainSheet.querySelectorAll('.added, .addedBG');
    addedElements.forEach(element => element.remove());

    data.forEach((item, index) => {
        const addedClass = index % 2 === 0 ? 'added' : 'added addedBG';

        let stateItem;
        if (item.state === "inCAF") {
            stateItem = "Em CAF"
        } else if (item.state === "inStreet") {
            stateItem = "Na Rua"
        } else if (item.state === "atTheBase") {
            stateItem = "BackLog"
        } else {
            stateItem = item.state
        }

        let stateTicket;
        if (item.ticket === "notAuthenticated") {
            stateTicket = "Não Auditado"
        } else if (item.ticket === "audited") {
            stateTicket = "Auditado"
        } else {
            stateTicket = "Indefinido"
        }
        const itemHTML = `
            <div class="${addedClass} CL_${item.state}" id="CAF_${item.CAF}">
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
function deleteData() {
    const select = document.querySelector(".collectTurnOffCaf").value;

    if (select === '0' || select === '00000000') {
        errorHandling("Valor invalido para ser apagado.");
        return;
    }

    const data = `CAF_${select}`;

    const deleted = document.querySelector(`#${data}`);


    if (deleted) {
        deleteLocalStorage(select)
    } else {
        errorHandling("Erro ao apagar Item.")
    }

    createSelectElement();

    createMessage()

}
function editOpen(){
    const select = document.querySelector(".collectTurnOffCaf").value;
    if (isEmptyOrUndefined(select)) return

    if (select === '0' || select === '00000000') {
        errorHandling("Valor invalido para ser editado.");
        return;
    }

    const config = document.querySelector(".editUsers")
    
    if (window.getComputedStyle(config).display === "none") {
        config.style = "display: flex";
        buttonEdit();
        editCAF(select)
    }

    
}
function editClosed(){
    // Hides the editing interface
    document.querySelector(".editUsers").style = "display: none";

    buttonEdit()
}
function editCAF(select){
    if (isEmptyOrUndefined(localStorage.getItem("main")) || isEmptyOrUndefined(localStorage.getItem("value"))) return;
    
    const editCafValue = document.querySelector(".editCafValue");
    const nameEdit = document.querySelector(".nameEdit");
    const stateEdit = document.querySelector(".stateEdit");
    const ticketEdit = document.querySelector(".ticketEdit");


    const main = localStorage.getItem('main');
    const myObjectMain = JSON.parse(main);

    
    const updatedMain = myObjectMain.filter(item => item.CAF === select)[0];

    if(updatedMain){
        nameEdit.value = updatedMain.driver
        
        const optionExistsState = Array.from(stateEdit.options).some(option => option.value === updatedMain.state);
        if(optionExistsState){
            stateEdit.value = updatedMain.state
        }else{
            stateEdit.value = 'atTheBase'
        }

        const optionExistsTicket = Array.from(ticketEdit.options).some(option => option.value === updatedMain.ticket);
        if(optionExistsTicket){
            ticketEdit.value = updatedMain.ticket
        }else{
            ticketEdit.value = "undefined"
        }

        editCafValue.innerHTML = `Editar CAF: ${updatedMain.CAF}  [ ${updatedMain.router} ]`     
    }

    
}
function editUser() {
    if (isEmptyOrUndefined(localStorage.getItem("main")) || isEmptyOrUndefined(localStorage.getItem("value"))) return;

    const CAF = document.querySelector(".collectTurnOffCaf").value;
    const nameEdit = document.querySelector(".nameEdit").value;
    const stateEdit = document.querySelector(".stateEdit").value;
    const ticketEdit = document.querySelector(".ticketEdit").value;

    let main = localStorage.getItem('main');
    let myObjectMain = JSON.parse(main);

    let value = localStorage.getItem('value');
    let myObjectValue = JSON.parse(value);

    // findsTheCorrespondingCafObjectInMyobjectMain
    const cafIndex = myObjectMain.findIndex(item => item.CAF === CAF);

    if (cafIndex !== -1) {
        const updatedMain = myObjectMain[cafIndex];

        // checksAndUpdatesTheDriver
        if (updatedMain.driver !== nameEdit) {
            updatedMain.driver = nameEdit;
        }

        // checkAndUpdateTheState
        if (updatedMain.state !== stateEdit) {
            // updateDispatchedCafeOnTheMyObjectValueObject
            if (stateEdit === "inStreet" && updatedMain.state !== "inStreet") {
                myObjectValue.dispatchedCAFs += 1;
            } else if ((stateEdit === "inCAF" || stateEdit === "atTheBase") && updatedMain.state === "inStreet") {
                myObjectValue.dispatchedCAFs -= 1;
            }

            updatedMain.state = stateEdit;
        }

        // checkAndUpdateTheTicket
        if (updatedMain.ticket !== ticketEdit) {
            // updatesAuditedcafsOnTheMyobjectvaluObjecte
            if (ticketEdit === "audited" && updatedMain.ticket !== "audited") {
                myObjectValue.auditedCAFs += 1;
            } else if (updatedMain.ticket === "audited" && (ticketEdit === "notAuthenticated" || ticketEdit === "undefined")) {
                myObjectValue.auditedCAFs -= 1;
            }

            updatedMain.ticket = ticketEdit;
        }

        // updatesTheMainObjectWithTheNewChanges
        myObjectMain[cafIndex] = updatedMain;

        // Saves updated objects in LocalStorage
        localStorage.setItem('main', JSON.stringify(myObjectMain));
        localStorage.setItem('value', JSON.stringify(myObjectValue));

        // updatesTheIuOrPerformsOtherNecessaryFunctions
        getLocalStorage();
        createSelectElement();
        createMessage();
        editClosed()
    } else {
        errorHandling(`CAF ${CAF} não encontrado em myObjectMain.`)
    }
}
function deleteDate() {
    localStorage.removeItem('main');
    localStorage.removeItem('value');
    const sheet = document.querySelector(".sheet")
    sheet.innerHTML = `
        <div class="herderSheet">
            <div class="logo">
                <div class="bgImage">
                    
                </div>
            </div>
            <div class="title">
                <span>RELATÓRIO DE CONTROLE</span>
                <span>TERCEIRO TURNO</span>
            </div>
            <div class="date">
                <span>08/08</span>
            </div>
            <div class="logoProperty">
            </div>
        </div>
        <div class="mainSheet">
            <div class="headerMainSheet">
                <div class="bcRouter">
                    <span>ROTA</span>
                </div>
                <div class="bcAggregate">
                    <span>AGREGADO</span>
                </div>
                <div class="bcCAF">
                    <span>CAF</span>
                </div>
                <div class="bcAmount">
                    <span>QTD</span>
                </div>
                <div class="bcState">
                    <span>STATUS</span>
                </div>
                <div class="bcSituation">
                    <span>SITUAÇÃO</span>
                </div>
            </div>
            <div class="added">
                <div class="bcRouter">
                    <span>000</span>
                </div>
                <div class="bcAggregate">
                    <span>NOME DO AGREGADO</span>
                </div>
                <div class="bcCAF">
                    <span>00000000</span>
                </div>
                <div class="bcAmount">
                    <span>0</span>
                </div>
                <div class="bcState">
                    <span>NULL</span>
                </div>
                <div class="bcSituation">
                    <span>NULL</span>
                </div>
            </div>
            <div class="added addedBG">
                <div class="bcRouter">
                    <span>000</span>
                </div>
                <div class="bcAggregate">
                    <span>NOME DO AGREGADO</span>
                </div>
                <div class="bcCAF">
                    <span>00000000</span>
                </div>
                <div class="bcAmount">
                    <span>0</span>
                </div>
                <div class="bcState">
                    <span>NULL</span>
                </div>
                <div class="bcSituation">
                    <span>NULL</span>
                </div>
            </div>
        </div>
        <div class="footerSheet">
            <div class="volumefooter">
                <span>VOLUMES EM CAF: 0</span>
            </div>
            <div class="Madefooter">
                <span>CAF’S FEITAS: 0</span>
            </div>
            <div class="auditedfooter">
                <span>CAF’S AUDITADA: 0</span>
            </div>
            <div class="issuedfooter">
                <span>CAF’S EXPEDIDAS: 0</span>
            </div>
        </div>
    `;
    const message = document.querySelector('.message');
    message.innerHTML = `
        <div class="title">
            <span class="h1">Mensagem</span>
        </div>
        <div class="box">
            <div class="msg">
                <span class="text textcopy withGraphic" onclick="copy()" style="white-space: pre-line;">
                    Bom-dia!<span style="display: none;">br</span>

                    *Caf's feitas, auditadas e expedidas pelo 3° turno*<span style="display: none;">br</span>

                    Hoje *data*, foram feitas *quantidade* caf's, movimentado 
                    *quantidade* peças para serem expedidas. <span style="display: none;">br</span>

                    Foram liberadas *quantidade* caf's um total de *quantidade* peças.<span style="display: none;">br</span>

                    Recebemos na base um total de *quantidade* peças dos embarque ( *embarque* | *emarque* ).<span style="display: none;">br</span>

                    @Wagner @Maria @Wellington @Luciano @Thallys @Kelvin @Emanuel <span style="display: none;">br</span>

                    ~Alan H. Silva
                </span>
                <span class="copy" style="position: absolute;">Copiado</span>
            </div>
        </div>
    `

    updateDate()
    createSelectElement()
}

//:------------------


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

    if (isEmptyOrUndefined(data)) return

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
function localStorageCreate(data, data2) {
    localStorage.setItem('main', JSON.stringify(data));
    localStorage.setItem('value', JSON.stringify(data2));
}
function getLocalStorage() {
    if (isEmptyOrUndefined(localStorage.getItem("main")) && isEmptyOrUndefined(localStorage.getItem("value"))) return

    const main = localStorage.getItem('main');
    const myObjectMain = JSON.parse(main);

    const value = localStorage.getItem('value');
    const myObjectValue = JSON.parse(value);

    createTable(myObjectMain, myObjectValue)
}
function deleteLocalStorage(CAF) {
    if (isEmptyOrUndefined(localStorage.getItem("main")) || isEmptyOrUndefined(localStorage.getItem("value"))) return;

    // Recover and parse the objects of the localStorage
    const main = localStorage.getItem('main');
    const myObjectMain = JSON.parse(main);

    const value = localStorage.getItem('value');
    const myObjectValue = JSON.parse(value);

    // Remove the item based on CAF
    const updatedMain = myObjectMain.filter(item => item.CAF !== CAF);

    // Update MyobjectValue based on removal
    const removedItem = myObjectMain.find(item => item.CAF === CAF);

    if (removedItem) {
        // Update VolumesinCaf
        const totalAWBsInCAF = updatedMain.reduce((acc, item) => acc + item.AWBS.length, 0);
        myObjectValue.volumesInCAF = totalAWBsInCAF;

        // Update TotalCAFS
        myObjectValue.totalCAFs = updatedMain.length;

        // Update Dispatched Cafs and Audited Caf
        if (removedItem.state === 'inStreet') {
            myObjectValue.dispatchedCAFs -= 1;
        }
        if (removedItem.ticket === 'audited') {
            myObjectValue.auditedCAFs -= 1;
        }
    }

    // Save updated objects in the LocalSorge
    localStorage.setItem('main', JSON.stringify(updatedMain));
    localStorage.setItem('value', JSON.stringify(myObjectValue));

    getLocalStorage()
}
async function generateImage() {
    createExcelFormat()

    const content = document.querySelector('.sheet');

    if (!content) {
        console.error('Content not found.');
        return;
    }

    // Store the original styles
    const originalStyles = {
        width: content.style.width,
        padding: content.style.padding,
    };

    // Adjust the width of the content element
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
        content.style.width = originalStyles.width;
        content.style.padding = originalStyles.padding;

        // Get the current date
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const formattedDate = `${day}.${month}`;

        // Create a download link and trigger the download
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `Report ${formattedDate}.png`;
        link.click();

    } catch (error) {
        // Restore the original styles if an error occurs
        content.style.width = originalStyles.width;
        content.style.padding = originalStyles.padding;
        console.error('An error occurred while generating the image:', error);
    }
}
function updateDate() {
    const dateSpan = document.querySelector('.herderSheet .date span');
    if (isEmptyOrUndefined(dateSpan)) return;

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
        addItem: function (item) {
            // Checks if the item already exists on the list
            if (!items.includes(item)) {
                items.push(item); // Add the item if it does not exist
            } else {
            }
        },
        getItems: function () {
            return items;
        }
    };
}
function copy() {
    const msgcopy = document.querySelector('.textcopy')
    const copy = document.querySelector('.copy')
    const msg = msgcopy

    const elementoTextCopy = msg.textContent.replace(/^\s+/gm, '').replace(/br/g, '\n');

    navigator.clipboard.writeText(elementoTextCopy)
        .then(() => {
            copy.style.display = 'flex'
            setTimeout(function () {
                copy.style.display = 'none'
            }, 500)
        })
        .catch((err) => {
            errorHandling('Erro ao copiar o texto ', err)
        });
}
function createSelectElement() {
    // Selects all .added elements within .mainsheet
    const addedElements = document.querySelectorAll('.mainSheet .added');

    if (isEmptyOrUndefined(addedElements)) return;

    // Maps the desired data of each element .added
    const data = Array.from(addedElements).map(element => {
        const router = element.querySelector('.bcRouter span')?.textContent || '';
        const aggregate = element.querySelector('.bcAggregate span')?.textContent || '';
        const caf = element.querySelector('.bcCAF span')?.textContent || '';

        return { router, aggregate, caf };
    });

    // Select the <select> element
    const selectElement = document.querySelector('.collectTurnOffCaf');

    // Check if the select element exists
    if (!selectElement) {
        console.error('Select element not found.');
        return;
    }

    // Remove all existing options except the first one
    while (selectElement.options.length > 1) {
        selectElement.remove(1);
    }

    // Iterate over the data and create options
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = `${item.caf}`; // Define the value of the option as the CAF
        option.textContent = `${item.router} - ${item.aggregate} (${item.caf})`; // Define the text of the option

        // Add the new option to the select element
        selectElement.appendChild(option);
    });
}
function createMessage() {
    const mensagemContainer = document.querySelector(".msg");
    const name = document.querySelector("#name").value

    if (isEmptyOrUndefined(localStorage.getItem("main")) && isEmptyOrUndefined(localStorage.getItem("value"))) return

    const value = localStorage.getItem('value');
    const myObjectValue = JSON.parse(value);

    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0'); // Add zero to the left if necessary
    const month = String(today.getMonth() + 1).padStart(2, '0'); // January is 0
    const formattedDate = `${day}/${month}`;

    const mensagemHTML = `
        <div class="msg">
            <span class="text textcopy withGraphic" onclick="copy()" style="white-space: pre-line;">
                Bom-dia!<span style="display: none;">br</span>

                *Caf's feitas, auditadas e expedidas pelo 3° turno*<span style="display: none;">br</span>

                Hoje *${formattedDate}*, foram feitas *${myObjectValue.totalCAFs}* caf's, movimentado 
                *${myObjectValue.volumesInCAF}* peças para serem expedidas. <span style="display: none;">br</span>

                Foram expedidas *${myObjectValue.dispatchedCAFs}* caf's<span style="display: none;">br</span>

                Recebemos na base um total de *${myObjectValue.volumes}* peças.<span style="display: none;">br</span>

                @Wagner @Maria @Wellington @Luciano @Thallys @Kelvin @Emanuel <span style="display: none;">br</span>

                ~${name}
            </span>
            <span class="copy" style="position: absolute;">Copiado</span>
        </div>
    `

    if (mensagemContainer) {
        mensagemContainer.innerHTML = mensagemHTML;
    } else {
        errorHandling("Elemento .msg não encontrado para inserir a mensagem.");
    }
}
function buttonEdit(){
    const button = document.querySelectorAll("button");
    const select = document.querySelectorAll(".collectTurnOffCaf")

    const editUsers = document.querySelector(".editUsers")
    for(let i = 0; i < button.length; i++) {
        if (window.getComputedStyle(editUsers).display === "none") {
            button[i].disabled = false
        }else{
            button[i].disabled = true
        }
    }
    for(let i = 0; i < select.length; i++) {
        if (window.getComputedStyle(editUsers).display === "none") {
            select[i].disabled = false
        }else{
            select[i].disabled = true
        }
    }
    document.querySelector(".buttonSave").disabled = false
}

//:-------------


//: ----- Users name menu -----

function configOpen() {
    const config = document.querySelector(".config")
    if (window.getComputedStyle(config).display === "none") {
        config.style = "display: flex";
    } else {
        config.style = "display: none";
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
    if (isEmptyOrUndefined(userName)) return


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

    if (isEmptyOrUndefined(userName)) return

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