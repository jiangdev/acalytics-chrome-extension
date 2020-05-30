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
  console.log("items: ", items)
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

function getArticlesList(articles) {
  let formattedArticles = articles.map((item) => {
    let title = item.title !== null ? item.title.replace(/[”“"]/g, "") : ""
    let journalName =
      item.journalName !== null ? item.journalName.replace(/[”“"]/g, "") : ""
    return [
      `${item.digitalObjectIdentifier}`,
      `"${title}"`,
      `${journalName}`,
      `${item.journalYear}`,
      `Article`,
    ]
  })

  return formattedArticles
}

function getBooksList(books) {
  let formattedBooks = books.map((item) => {
    let title = item.title !== null ? item.title.replace(/[”“"]/g, "") : ""
    return [``, `"${title}"`, ``, `${item.activityYear}`, `Book`]
  })

  return formattedBooks
}

function getBookChapters(bookChapters) {
  let formattedBookChapters = bookChapters.map((item) => {
    let title = item.name !== null ? item.name.replace(/[”“"]/g, "") : ""
    return [``, `"${title}"`, ``, `${item.activityYear}`, `BookChapter`]
  })

  return formattedBookChapters
}

function getConferenceProceedings(conferenceProceedings) {
  let formattedConferenceProceedings = conferenceProceedings.map((item) => {
    let title = item.title !== null ? item.title.replace(/[”“"]/g, "") : ""
    return [
      ``,
      `"${title}"`,
      ``,
      `${item.journalYear}`,
      `ConferenceProceedings`,
    ]
  })

  return formattedConferenceProceedings
}

function createCSVFromResult(result) {
  let headers = ["DOI", "Title", "Journal", "Year", "Type"]

  let items = [
    ...getArticlesList(result.articles),
    ...getBooksList(result.books),
    ...getBookChapters(result.bookChapters),
    ...getConferenceProceedings(result.conferenceProceedings),
  ]

  exportCSVFile(
    headers,
    items,
    `${result.firstName.toLowerCase()}-${result.lastName.toLowerCase()}`
  )
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
        createCSVFromResult(JSON.parse(result))
      }
    )

    chrome.tabs.executeScript(tabs[0].id, {
      code: 'document.body.style.backgroundColor = "' + color + '";',
    })
  })
}
