document.addEventListener("DOMContentLoaded", function () {
    getUser()
    getName()
    document.querySelector('.collectSelectName').addEventListener('change', function () {
        selectName();
    });
});

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
    const ticketsData = document.querySelector("#data2").value;
    
    const mainDataObject = createObjectData(mainData)
    const ticketsDataObject = createObjectTickets(ticketsData)

    console.log(mainDataObject);
    console.log(ticketsDataObject);
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

    // Turning data into validation objects
    return data.map(line => {
        const parts = line.split('\t');
        
        // Check if the line has exactly 5 parts
        if (parts.length !== 5) {
            errorHandling(
                "Os dados fornecidos no campo 'Dados Principais' são inválidos. Por favor, verifique e corrija as informações antes de enviar.",
                new Error(`Invalid line format: ${line}`)
            );
            return null; // Returns null to indicate invalid line
        }

        const [awb, router, boarding, caf, driver] = parts;
        return {
            AWB: awb,
            router: extractRouterValue(router),
            boarding: boarding,
            CAF: caf,
            driver: driver
        };
    }).filter(item => item !== null); // Filters Invalid Items
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
//:-------------