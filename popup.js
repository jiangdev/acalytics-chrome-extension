let changeColor = document.getElementById("changeColor")
function httpGetAsync(theUrl, callback) {
  var xmlHttp = new XMLHttpRequest()
  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
      callback(xmlHttp.responseText)
  }
  xmlHttp.open("GET", theUrl, true) // true for asynchronous
  xmlHttp.send(null)
}

function convertToCSV(items) {
  var lines = ""
  items.forEach((element) => {
    let line = element.join(",")
    lines += line + "\r\n"
  })

  return lines
}

function exportCSVFile(headers, items, fileTitle) {
  // Convert Object to JSON
  if (headers) {
    items.unshift(headers)
  }
  var jsonObject = JSON.stringify(items)
  var csv = this.convertToCSV(items)

  var exportedFilenmae = fileTitle + ".csv" || "export.csv"

  let blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  let link = document.createElement("a")
  if (link.download !== undefined) {
    // feature detection
    // Browsers that support HTML5 download attribute
    let url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", exportedFilenmae)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

function createCSVFromResult(result) {
  let headers = ["Year", "Type", "Title", "Journal", "DOI", "Scholars"]

  let results = result.map((item) => {
    let title = item.title !== null ? item.title.replace(/[”“"]/g, "") : ""
    let journalName =
      item.journalName !== null ? item.journalName.replace(/[”“"]/g, "") : ""
    return [
      `${item.journalYear}`,
      `Article`,
      `"${title}"`,
      `${journalName}`,
      `${item.digitalObjectIdentifier}`,
      `scholar`,
    ]
  })

  exportCSVFile(headers, results, "Article")
}

chrome.storage.sync.get("color", function (data) {
  changeColor.style.backgroundColor = data.color
  changeColor.setAttribute("value", data.color)
})

changeColor.onclick = function (element) {
  let color = element.target.value
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    let urlParts = tabs[0].url.split("/")
    var professorIDIndex = urlParts.findIndex((part) => part === "stack") + 1

    httpGetAsync(
      `https://missouri.discovery.academicanalytics.com/api/people/${urlParts[professorIDIndex]}`,
      (result) => {
        createCSVFromResult(JSON.parse(result).articles)
      }
    )

    chrome.tabs.executeScript(tabs[0].id, {
      code: 'document.body.style.backgroundColor = "' + color + '";',
    })
  })
}
