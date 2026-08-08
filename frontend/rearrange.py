with open('src/pages/receptionist/BookAppointmentPage.tsx', 'r') as f:
    content = f.read()

# Find the parts
part1 = content.split('        {/* Left Column: Patient Selection & Doctor Info */}')[0]
rest = content.split('        {/* Left Column: Patient Selection & Doctor Info */}')[1]

left_col_start = '        <div className="space-y-6 lg:col-span-2">\n'
patient_selection = rest.split('          <div className="bg-surface border border-border-light rounded-3xl p-6 shadow-sm">\n            <div className="flex items-center gap-4 mb-4">')[0]
patient_selection = patient_selection.replace('        <div className="space-y-6 lg:col-span-1">\n', left_col_start)

doctor_info = '          <div className="bg-surface border border-border-light rounded-3xl p-6 shadow-sm">\n            <div className="flex items-center gap-4 mb-4">' + rest.split('          <div className="bg-surface border border-border-light rounded-3xl p-6 shadow-sm">\n            <div className="flex items-center gap-4 mb-4">')[1].split('        </div>\n\n        {/* Right Column: Date, Type and Confirmation */}')[0]

right_col_rest = rest.split('        {/* Right Column: Date, Type and Confirmation */}')[1]
right_col_content = right_col_rest.split('        <div className="lg:col-span-2 space-y-6">\n')[1]

weekly_and_booking = right_col_content.split('        </div>\n      </div>\n    </div>\n  );\n}')[0]

new_grid = part1 + """        {/* Left Column (Wider): Patient Selection, Schedule, Booking */}
""" + patient_selection + weekly_and_booking + """        </div>

        {/* Right Column (Narrower): Doctor Info */}
        <div className="space-y-6 lg:col-span-1">
""" + doctor_info + """        </div>
      </div>
    </div>
  );
}
"""

with open('src/pages/receptionist/BookAppointmentPage.tsx', 'w') as f:
    f.write(new_grid)
