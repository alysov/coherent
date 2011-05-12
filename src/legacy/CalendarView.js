/*jsl:import coherent*/

/** A date selection view that presents a calendar. Ultimately, it should be
  possible to attach to a {@link coherent.TextField} and have the calendar pop
  up when the TextField becomes the first responder.
 */
coherent.CalendarView = Class.create(coherent.View, {

  exposedBindings: ['selectedDate'],

  /** The format that will be used for the caption of the Calendar. The
    available fields are: month, monthName, monthShortName, and year. At the
    moment, these values aren't localised.
    @type String
   */
  captionFormat: "${monthShortName} ${year}",

  /** The class to apply to nodes from the previous month.
    @type String
   */
  previousMonthClass: "cal-previous-month",

  /** The class to apply to nodes belonging to the next month.
    @type String
   */
  nextMonthClass: "cal-next-month",

  /** The class to apply to the current day.
    @type String
   */
  todayClass: "cal-today",

  /** Full month names. These should be localised. */
  monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],

  /** Short month names. These should be localised. */
  monthShortNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],

  /** Days of the week. These should be localised. */
  daysOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],

  /** Number of days in each month. */
  daysPerMonth: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],

  /**
    coherent.CalendarView#today -> Date
    
    Quick access to the current date. @TODO Setup a single timer to update
    the value of today when the clock rolls over.
   */
  today: new Date(),

  /**
    The structural markup for this calendar if none was provided by the page.
    The present mark up is:
  
        <div class="calendar"></div>
  
    @type String
   */
  markup: '<div class="calendar"></div>',

  /**
    The inner HTML that will be used if the page doesn't supply custom mark up.
    The current mark up is:
  
        <div class="cal-caption">
            <button class="cal-previous-month">Previous</button>
            <span class="cal-caption"></span>
            <button class="cal-next-month">Next</button>
        </div>
  
    The mark up for the days of the month is automatically generated and
    isn't represented in the mark up.
    @type String
   */
  innerHTML: '<div class="cal-caption"><button class="cal-previous-month">Previous</button><span class="cal-caption"></span><button class="cal-next-month">Next</button></div>',

  __structure__: {
    'button.cal-previous-month': coherent.Button({
      action: 'showPreviousMonth'
    }),
    'button.cal-next-month': coherent.Button({
      action: 'showNextMonth'
    })

  },

  /** Initialise the calendar view. This will build all the child nodes that
    represent the calendar.
   */
  init: function()
  {
    this.__previousMonthNodes = [];
    this.__nextMonthNodes = [];
    this.__monthNodes = [];

    this.buildCalendar();
    this.__selectedDate = new Date(0);
    this.setDate(this.today, false);
  },

  /** Property accessor for the date associated with the calendar. The calendar
    will display the month that includes this date.
  
    @type Date
   */
  date: function()
  {
    return this.__date;
  },

  /** Change the date of the calendar. The calendar will show the full month
    that contains this date.
  
    @param {Date} newDate - the date to show
   */
  setDate: function(newDate)
  {
    this.__date = new Date(newDate.getTime());

    var month = this.__date.getMonth();
    var year = this.__date.getFullYear();

    var dateInfo = {
          month: month + 1,
          monthName: this.monthNames[month],
          monthShortName: this.monthShortNames[month],
          year: year
        };
    var caption = this.captionFormat.expand(dateInfo);

    var captionNode = Element.query(this.node, 'span.cal-caption');
    captionNode.innerHTML = caption;

    this.updatePreviousMonthDays();
    this.updateMonthDays();
    this.updateNextMonthDays();
  },

  /** The date that has been selected by the user.
    @type Date
   */
  selectedDate: function()
  {
    if (0 === this.__selectedDate.getTime())
      return null;
    return this.__selectedDate;
  },

  /** Select a specific date on the calendar. This will change the calendar
    to display the month containing the selected date.
  
    @param {Date} newDate - the date that should be selected
   */
  setSelectedDate: function(newDate)
  {
    if ('date' !== coherent.typeOf(newDate))
      newDate = new Date(0);

    this.__selectedDate = new Date(newDate.getTime());
    //  Show this date
    this.setDate(this.__selectedDate);
  },

  /** Build the nodes that are associated with the calendar.
   */
  buildCalendar: function()
  {
    /*  Total number of items needed is 1 for each possible day in
      the month + max number of previous month days to show (6) +
      max number of next month days to show (6).
     */
    var totalItems = 31 + 12;
    var template = document.createElement('li');

    var container = this.node;
    var frag = document.createDocumentFragment();
    var list = document.createElement('ol');
    frag.appendChild(list);

    var i;
    var node;

    template.className = 'cal-previous-month day';
    for (i = 0; i < 6; ++i)
    {
      node = template.cloneNode(true);
      node.innerHTML = "P";
      list.appendChild(node);
      this.__previousMonthNodes.push(node);
    }

    template.className = 'cal-current-month day';
    for (i = 0; i < 31; ++i)
    {
      node = template.cloneNode(true);
      node.innerHTML = (i + 1);
      list.appendChild(node);
      this.__monthNodes.push(node);
    }

    template.className = 'cal-next-month day';
    for (i = 0; i < 13; ++i)
    {
      node = template.cloneNode(true);
      node.innerHTML = "N";
      list.appendChild(node);
      this.__nextMonthNodes.push(node);
    }

    container.appendChild(frag);
  },

  /** Determine what days from the previous month to show.
   */
  updatePreviousMonthDays: function()
  {
    var previousMonth = this.previousMonth(this.__date);
    var daysInPreviousMonth = this.daysInMonth(previousMonth);
    var firstDayOfMonth = this.firstDayOfMonth(this.__date);
    var dayOfWeekOfFirstDay = firstDayOfMonth.getDay();
    var numberOfPreviousDays = dayOfWeekOfFirstDay;

    var day = daysInPreviousMonth;

    for (var i = 0; i < 6; ++i)
    {
      var dayNode = this.__previousMonthNodes[5 - i];
      var show = i < numberOfPreviousDays;
      var visible = ('none' !== dayNode.style.display);

      dayNode.innerHTML = day--;
      dayNode.style.display = show ? '' : 'none';
    }
  },

  /** Determine the number of days from the following month to show.
   */
  updateNextMonthDays: function()
  {
    var nextMonth = this.nextMonth(this.__date);
    var firstDayOfMonth = this.firstDayOfMonth(nextMonth);
    var dayOfWeekOfFirstDay = firstDayOfMonth.getDay();
    var numberOfNextDays;

    if ((this.firstDayOfMonth(this.__date).getDay() + this.daysInMonth(this.__date)) < 35)
      numberOfNextDays = 14 - dayOfWeekOfFirstDay;
    else
      numberOfNextDays = 7 - dayOfWeekOfFirstDay;

    for (var i = 0; i < 13; ++i)
    {
      var dayNode = this.__nextMonthNodes[i];
      var show = i < numberOfNextDays;
      var visible = ('none' !== dayNode.style.display);

      dayNode.innerHTML = (i + 1);
      dayNode.style.display = show ? '' : 'none';
    }
  },

  /** Update the current month nodes only showing the correct number.
   */
  updateMonthDays: function()
  {
    var daysInMonth = this.daysInMonth(this.__date);
    var checkForToday = (this.__date.getMonth() === this.today.getMonth() && this.__date.getFullYear() === this.today.getFullYear());
    var todayDayOfMonth = this.today.getDate();
    var checkForSelected = (this.__selectedDate.getMonth() === this.__date.getMonth() && this.__selectedDate.getFullYear() === this.__date.getFullYear());
    var selectedDayOfMonth = this.__selectedDate.getDate();

    for (var i = 0; i < 31; ++i)
    {
      var dayNode = this.__monthNodes[i];
      var show = i < daysInMonth;
      var visible = ('none' !== dayNode.style.display);

      dayNode.innerHTML = (i + 1);

      if (checkForToday && todayDayOfMonth == (i + 1))
        Element.addClassName(dayNode, this.todayClass);
      else
        Element.removeClassName(dayNode, this.todayClass);

      if (checkForSelected && selectedDayOfMonth == (i + 1))
        Element.addClassName(dayNode, coherent.Style.kSelectedClass);
      else
        Element.removeClassName(dayNode, coherent.Style.kSelectedClass);

      dayNode.style.display = show ? '' : 'none';
    }
  },

  /** Return the first day of the month containing the specified date.
    @type Date
   */
  firstDayOfMonth: function(date)
  {
    date = new Date(date.getTime());
    date.setDate(1);
    return date;
  },

  /** Return the number of days in the month containing the specified date.
    @type Number
   */
  daysInMonth: function(date)
  {
    var month = date.getMonth();
    var year = date.getFullYear();

    if (month < 0)
    {
      month = 12 - month;
      year--;
    }
    if (month > 11)
    {
      month -= 12;
      year++;
    }
    var days = this.daysPerMonth[month];
    if (1 != month)
      return days;

    var leapYear = (0 === year % 4 && (0 !== year % 100 || 0 === year % 400));
    if (leapYear)
      return days + 1;
    return days;
  },

  /** Return the first day of the month before the month containing the date
    specified.
    @type Date
   */
  previousMonth: function(date)
  {
    var newDate = new Date(date.getTime());
    var month = date.getMonth() - 1;
    if (month < 0)
    {
      month = 11;
      newDate.setFullYear(date.getFullYear() - 1);
    }
    newDate.setDate(1);
    newDate.setMonth(month);
    newDate.setDate(Math.min(date.getDate(), this.daysInMonth(newDate)));
    return newDate;
  },

  /** Return the first day of the month after the month containing the date
    specified.
    @type Date
   */
  nextMonth: function(date)
  {
    var newDate = new Date(date.getTime());
    newDate.setDate(1);
    newDate.setMonth(date.getMonth() + 1);
    newDate.setDate(Math.min(date.getDate(), this.daysInMonth(newDate)));
    return newDate;
  },

  /** Handle clicks on a day within the calendar. If the visitor clicks on a
    day in the previous or next month, the calendar is changed to display
    that month. The actual date clicked on is selected.
  
    @param {Event} event - A standard click event.
   */
  onclick: function(event)
  {
    var node = event.target || event.srcElement;
    var view = this.node;

    while (node && node != view && 'LI' !== node.tagName)
      node = node.parentNode;
    if (!node || node == view)
      return;

    var date = new Date(this.__date.getTime());
    var index;

    //  Check where the click occurred
    if (-1 !== (index = this.__previousMonthNodes.indexOf(node)))
    {
      date = this.previousMonth(date);
      date.setDate(26 + index);
    }
    else if (-1 !== (index = this.__monthNodes.indexOf(node)))
    {
      date.setDate(index + 1);
    }
    else if (-1 !== (index = this.__nextMonthNodes.indexOf(node)))
    {
      date = this.nextMonth(date);
      date.setDate(index + 1);
    }

    Event.preventDefault(event);

    this.setSelectedDate(date);

    if (this.bindings.selectedDate)
      this.bindings.selectedDate.setValue(this.__selectedDate);
  },

  /** Show the previous month.
    @param {coherent.View} sender - this is the view that is invoking the
            action (usually filled in by the framework)
   */
  showPreviousMonth: function(sender)
  {
    var date = this.previousMonth(this.__date);
    this.setDate(date);
  },

  /** Show the next month.
    @param {coherent.View} sender - this is the view that is invoking the
            action (usually filled in by the framework)
   */
  showNextMonth: function(sender)
  {
    var date = this.nextMonth(this.__date);
    this.setDate(date);
  }

});
