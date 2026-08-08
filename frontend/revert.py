with open('src/pages/receptionist/BookAppointmentPage.tsx', 'r') as f:
    content = f.read()

# Extract blocks based on the NEW structure

part1 = content.split('        {/* Left Column (Wider): Patient Selection, Schedule, Booking */}')[0]
rest = content.split('        {/* Left Column (Wider): Patient Selection, Schedule, Booking */}')[1]

# In rest, we have:
# <div className="space-y-6 lg:col-span-2">
# Patient Selection
# Weekly Schedule
# Booking Details
# </div>
# {/* Right Column (Narrower): Doctor Info */}
# <div className="space-y-6 lg:col-span-1">
# Doctor Info
# </div>

patient_selection_and_right_col = rest.split('        </div>\n\n        {/* Right Column (Narrower): Doctor Info */}')[0]
patient_selection_and_right_col = patient_selection_and_right_col.replace('        <div className="space-y-6 lg:col-span-2">\n', '')

patient_selection = patient_selection_and_right_col.split('          {/* Weekly Schedule Section */}')[0]
weekly_and_booking = '          {/* Weekly Schedule Section */}' + patient_selection_and_right_col.split('          {/* Weekly Schedule Section */}')[1]

doctor_info = rest.split('        {/* Right Column (Narrower): Doctor Info */}\n        <div className="space-y-6 lg:col-span-1">\n')[1].split('        </div>\n      </div>')[0]

new_content = part1 + """        {/* Left Column: Patient Selection & Doctor Info */}
        <div className="space-y-6 lg:col-span-1">
""" + patient_selection + doctor_info + """        </div>

        {/* Right Column: Date, Type and Confirmation */}
        <div className="lg:col-span-2 space-y-6">
""" + weekly_and_booking + """        </div>
      </div>
    </div>
  );
}
"""

with open('src/pages/receptionist/BookAppointmentPage.tsx', 'w') as f:
    f.write(new_content)
