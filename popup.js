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

function getArticlesList(articles) {
  let formattedArticles = articles.map((item) => {
    let title = item.title !== null ? item.title.replace(/[”“"]/g, "") : ""
    let journalName =
      item.journalName !== null ? item.journalName.replace(/[”“"]/g, "") : ""
    let articleType =
      item.activitySubtype === 1
        ? "Article"
        : item.activitySubtype === 5
        ? "Book Review"
        : "Other"

    return {
      DOI: `${item.digitalObjectIdentifier}`,
      Title: `${title}`,
      Journal: `${journalName}`,
      Year: `${item.journalYear}`,
      Type: `${articleType}`,
    }
  })

  return formattedArticles
}

function getBooksList(books) {
  let formattedBooks = books.map((item) => {
    let title = item.title !== null ? item.title.replace(/[”“"]/g, "") : ""
    return {
      DOI: ``,
      Title: `${title}`,
      Journal: ``,
      Year: `${item.activityYear}`,
      Type: `Book`,
    }
  })

  return formattedBooks
}

function getBookChapters(bookChapters) {
  let formattedBookChapters = bookChapters.map((item) => {
    let title = item.name !== null ? item.name.replace(/[”“"]/g, "") : ""
    return {
      DOI: ``,
      Title: `${title}`,
      Journal: ``,
      Year: `${item.activityYear}`,
      Type: `Book Chapter`,
    }
  })

  return formattedBookChapters
}

function getConferenceProceedings(conferenceProceedings) {
  let formattedConferenceProceedings = conferenceProceedings.map((item) => {
    let title = item.title !== null ? item.title.replace(/[”“"]/g, "") : ""
    return {
      DOI: ``,
      Title: `${title}`,
      Journal: ``,
      Year: `${item.journalYear}`,
      Type: `Conference Proceedings`,
    }
  })

  return formattedConferenceProceedings
}

function createCSVFromResult(result) {
  let header = ["DOI", "Title", "Journal", "Year", "Type"]

  let items = [
    ...getArticlesList(result.articles),
    ...getBooksList(result.books),
    ...getBookChapters(result.bookChapters),
    ...getConferenceProceedings(result.conferenceProceedings),
  ]

  var wb = XLSX.utils.book_new()
  var ws = XLSX.utils.json_to_sheet(items, { header })
  XLSX.utils.book_append_sheet(wb, ws, "test")
  XLSX.writeFile(
    wb,
    `${result.firstName.toLowerCase()}-${result.lastName.toLowerCase()}.xlsx`
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
