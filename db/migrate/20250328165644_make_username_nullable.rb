class MakeUsernameNullable < ActiveRecord::Migration[7.1]
  def change
    change_column_null :users, :username, true
  end  
end
