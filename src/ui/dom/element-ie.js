/*jsl:import element.js*/

//  IE does things different, of course.
if (coherent.Browser.IE)
{
    Element.setStyle= function(element, prop, value)
    {
        if ('opacity'!=prop)
        {
            element.style[prop]= value;
            return;
        }

        //  Handle wacky IE filter stuff
        var filter = element.style.filter;
        var style = element.style;

        if (value == 1 || value === '')
        {
            style.filter = filter.replace(/alpha\([^\)]*\)/gi,'');
            return;
        }
        
        if (value < 0.00001)
            value = 0;
        style.filter = filter.replace(/alpha\([^\)]*\)/gi, '') +
                       'alpha(opacity=' + (value * 100) + ')';
    }
    
    Element.setStyles= function(element, styles)
    {
        var elementStyle= element.style;
        
        for (var p in styles)
        {
            if ('opacity'==p)
                Element.setStyle(element, p, styles[p]);
            else
                elementStyle[p]= styles[p];
        }
    }

    Element.getStyles= function(element, propsToGet)
    {
        var currentStyle= element.currentStyle;
        var styles = {};
        var opacity;
        var extra;
        
        if ('string'===typeof(propsToGet))
            switch (propsToGet)
            {
                case 'opacity':
                    opacity = currentStyle.filter.match(/opacity=(\d+)/i);
                    return (null===opacity ? 1 : parseInt(opacity[1], 10)/100);
                case 'width':
                    extra += parseInt(currentStyle.borderLeftWidth, 10)||0 + 
                             parseInt(currentStyle.borderRightWidth, 10)||0 +
                             parseInt(currentStyle.paddingLeft, 10)||0 +
                             parseInt(currentStyle.paddingRight, 10)||0;
                    return Math.max(0, element.offsetWidth - extra) + 'px';
                case 'height':
                    extra += parseInt(currentStyle.borderTopWidth, 10)||0 + 
                             parseInt(currentStyle.borderBottomWidth, 10)||0 +
                             parseInt(currentStyle.paddingTop, 10)||0 +
                             parseInt(currentStyle.paddingBottom, 10)||0;
                    return Math.max(0, element.offsetHeight - extra) + 'px';
                case 'backgroundPosition':
                    return currentStyle.backgroundPositionX+' '+
                           currentStyle.backgroundPositionY;
                default:
                    return currentStyle[p];
            }
        
        propsToGet= propsToGet||Element.PROPERTIES;

        var p;
        var len= propsToGet.length;
        
        while (len--)
        {
            p= propsToGet[len];
            switch (p)
            {
                case 'opacity':
                    opacity = currentStyle.filter.match(/opacity=(\d+)/i);
                    styles[p] = (null===opacity ? 1 : parseInt(opacity[1], 10)/100);
                    break;
                case 'width':
                    extra += parseInt(currentStyle.borderLeftWidth, 10)||0 + 
                             parseInt(currentStyle.borderRightWidth, 10)||0 +
                             parseInt(currentStyle.paddingLeft, 10)||0 +
                             parseInt(currentStyle.paddingRight, 10)||0;
                    styles[p]= Math.max(0, element.offsetWidth - extra) + 'px';
                    break;
                case 'height':
                    extra += parseInt(currentStyle.borderTopWidth, 10)||0 + 
                             parseInt(currentStyle.borderBottomWidth, 10)||0 +
                             parseInt(currentStyle.paddingTop, 10)||0 +
                             parseInt(currentStyle.paddingBottom, 10)||0;
                    styles[p]= Math.max(0, element.offsetHeight - extra) + 'px';
                    break;
                case 'backgroundPosition':
                    styles[p] = currentStyle.backgroundPositionX+' '+
                                currentStyle.backgroundPositionY;
                    break;
                default:
                    styles[p] = currentStyle[p];
                    break;
            }
        }
    
        return styles;
    };
    Element.getStyle= Element.getStyles;

    Element.clone= function(element)
    {
        var node= element.cloneNode(false);
        
        if ('TR'!=element.tagName)
        {
            node.innerHTML= element.innerHTML;
            return node;
        }

        // special handling for TRs
        var cellIndex;
        var originalCell;
        var newCell;

        for (cellIndex=0; cellIndex<element.children.length; ++cellIndex)
        {
            originalCell= element.children[cellIndex];
            newCell= originalCell.cloneNode(false);
            newCell.id= '';
            newCell.innerHTML= originalCell.innerHTML;
            node.appendChild(newCell);
        }
        return node;
    };
}