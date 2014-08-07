# WebDriver for combitorial testing

## Install
```sh
npm install -g wd-ct
wd-ct -i input.csv -a assertion.csv -t testcase.csv
```

### CSV
#### input.csv
Define input interation of wd
```csv
open,,get('{{val}}')
input query,,elementByCss('#lst-ib').type('{{val}}')
submit,,elementByCss('[name="btnK"]').click()
```

#### assertion.csv
Define input assertion of wd
```csv
should be display github page,"waitForElementByCss('a[href=""https://github.com/""]', 1000).should.be.fulfilled"
should be display sideroad secret page,"waitForElementByCss('a[href=""http://sideroad.secret.jp/""]').should.be.fulfilled"
```

#### testcase.csv
Define testcase. Write input pattern and assertion.
```csv
open,input query,submit,open,assert
https://www.google.co.jp/,github,,http://github.com/,should be display github page
https://www.google.co.jp/,sideroad secret,,http://github.com/,should be display sideroad secret page
```
