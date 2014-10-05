var selectbox = arguments[0],
    options = selectbox.getElementsByTagName('option') || [],
    text = String( arguments[1] ),
    i,
    option,
    len = options.length,
    selectedIndex = 0;

for(i = 0; i<len; i++){
  option = options[i];
  if(option.innerHTML === text){
      selectedIndex = i;
      break;
  }
}
selectbox.selectedIndex = selectedIndex;
